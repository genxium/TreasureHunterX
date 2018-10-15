package models

import (
  "time"
  "sync"
  "server/common/utils"
)

type RoomState struct {
	IDLE          int
	WAITING       int
	IN_BATTLE     int
  STOPPING_BATTLE_FOR_SETTLEMENT  int
	IN_SETTLEMENT int
	IN_DISMISSAL  int
}

// A single instance containing only "named constant integers" to be shared by all threads.
var RoomStateIns RoomState

func calRoomScore(inRoomPlayerCount int, roomCapacity int, currentRoomState int) float32 {
	x := float32(inRoomPlayerCount) / float32(roomCapacity)
  d := (x - 0.5)
  d2 := d*d
	return -7.8125*d2 + 5.0 - float32(currentRoomState)
}

func InitRoomStateIns() {
  RoomStateIns = RoomState{
		IDLE:          0,
		WAITING:       0,
		IN_BATTLE:     9999999,
		STOPPING_BATTLE_FOR_SETTLEMENT:  9999999,
		IN_SETTLEMENT: 9999999,
		IN_DISMISSAL:  9999999,
	}
}

type Room struct {
	ID       int             `json:"id"`
	Capacity int             `json:"capacity"`
	Players  map[int]*Player
  /**
  * The following `PlayerDownsyncChanDict` is NOT individually put 
  * under `type Player struct` for a reason.
  * 
  * Upon each connection establishment, a new instance `player Player` is created for the given `playerId`. 

  * To be specific, if 
  *   - that `playerId == 42` accidentally reconnects in just several milliseconds after a passive disconnection, e.g. due to bad wireless signal strength, and 
  *   - that `type Player struct` contains a `DownsyncChan chan interface{}` field
  *
  * , then we might have to
  *   - clean up `previousPlayerInstance.DownsyncChan`   
  *   - initialize `currentPlayerInstance.DownsyncChan`   
  * 
  * to avoid chaotic flaws.
  */
	PlayerDownsyncChanDict  map[int]chan interface{}
	CmdFromPlayersChan  chan interface{}
	Score    float32
	State    int
	Index    int
  Tick     int
  ServerFPS int
  DismissalWaitGroup sync.WaitGroup
}

type RoomDownsyncFrame struct {
  ID    int   `json:"id"`
  RefFrameID    int   `json:"refFrameId"`
  Players       map[int]*Player  `json:"players"`
  SentAt        int64 `json:"sentAt"`
}

func (pR *Room) updateScore() {
	pR.Score = calRoomScore(len(pR.Players), pR.Capacity, pR.State)
}

func (pR *Room) lazilyInitPlayerDownSyncChan(playerId int) {
  r := *pR
  if r.PlayerDownsyncChanDict[playerId] != nil {
    return
  }
  r.PlayerDownsyncChanDict[playerId] = make(chan interface{}, 1024 /* Hardcoded temporarily. */)
  return
}

func (pR *Room) AddPlayerIfPossible(pPlayer *Player) bool {
  // TODO: Check feasibility first.
  pR.Players[pPlayer.ID] = pPlayer
  pR.lazilyInitPlayerDownSyncChan(pPlayer.ID)
  pR.updateScore()
  if pR.Capacity == len(pR.Players) {
    pR.StartBattle()
  }
  /* TODO: Invoke r.StartBattle or update r.State accordingly. */
  return true
}

func (pR *Room) StartBattle() {
  if RoomStateIns.WAITING != pR.State {
    return
  }
  pR.State = RoomStateIns.IN_BATTLE
  millisPerFrame := 1000/int64(pR.ServerFPS)
  twiceMillisPerFrame := 2*millisPerFrame
  pR.Tick = 0
  /**
  * Will be triggered from a goroutine which executes the critical `Room.AddPlayerIfPossible`, thus the `battleMainLoop` should be detached. 
  * All of the consecutive stages, e.g. settlement, dismissal, should share the same goroutine with `battleMainLoop`.
  */
  battleMainLoop := func () {
    for {
      if (RoomStateIns.IN_BATTLE != pR.State) {
        break
      }
      pR.Tick++
      stCalculation := utils.UnixtimeMilli()
      for playerId, _ := range pR.Players {
        assembledFrame := &RoomDownsyncFrame{
          ID: pR.Tick,
          RefFrameID: 0, // Hardcoded for now.
          Players: pR.Players,
          SentAt: utils.UnixtimeMilli(),
        }
        theForwardingChannel := pR.PlayerDownsyncChanDict[playerId]
        utils.SendSafely(assembledFrame, theForwardingChannel)
      }
      elapsedMillisInCalculation := utils.UnixtimeMilli() - stCalculation
      time.Sleep(time.Millisecond * time.Duration(millisPerFrame - elapsedMillisInCalculation))
    }
    pR.onBattleStoppedForSettlement()
  }

  go battleMainLoop()

  cmdReceivingLoop := func() {
    for {
      if (RoomStateIns.IN_BATTLE != pR.State) {
        break
      }
      stCalculation := utils.UnixtimeMilli()
      select {
        case tmp := <-pR.CmdFromPlayersChan:
          immediatePlayerData := tmp.(*Player)
          // Update immediate player info for broadcasting or unicasting.
          pR.Players[immediatePlayerData.ID].X = immediatePlayerData.X
          pR.Players[immediatePlayerData.ID].Y = immediatePlayerData.Y
        default:
      }
      elapsedMillisInCalculation := utils.UnixtimeMilli() - stCalculation
      time.Sleep(time.Millisecond * time.Duration(twiceMillisPerFrame - elapsedMillisInCalculation))
    }
  }

  go cmdReceivingLoop()
}

func (pR *Room) StopBattleForSettlement() {
  if RoomStateIns.IN_BATTLE != pR.State {
    return
  }
  pR.State = RoomStateIns.STOPPING_BATTLE_FOR_SETTLEMENT
}

func (pR *Room) onBattleStoppedForSettlement() {
  if RoomStateIns.STOPPING_BATTLE_FOR_SETTLEMENT != pR.State {
    return
  }
  pR.State = RoomStateIns.IN_SETTLEMENT

  pR.onSettlementCompleted()
}

func (pR *Room) onSettlementCompleted() {
  pR.Dismiss()
}

func (pR *Room) Dismiss() {
  if RoomStateIns.IN_SETTLEMENT != pR.State {
    return
  }
  pR.State = RoomStateIns.IN_DISMISSAL
  for playerId, _ := range pR.Players {
    pR.DismissalWaitGroup.Add(1)
    pR.expelPlayerForDismissal(playerId)
  }
  pR.DismissalWaitGroup.Wait()
  pR.onDismissed()
}

func (pR *Room) onDismissed() {
  pR.Players = nil
  pR.PlayerDownsyncChanDict = nil
  utils.CloseSafely(pR.CmdFromPlayersChan)
  pR.CmdFromPlayersChan = nil
}

func (pR *Room) Unicast(toPlayerId int, msg interface{}) {
  // TODO
}

func (pR *Room) Broadcast(msg interface{}) {
  // TODO
}

func (pR *Room) expelPlayerDuringGame(playerId int) {
  utils.CloseSafely(pR.PlayerDownsyncChanDict[playerId])
  pR.onPlayerExpelledDuringGame(playerId)
}

func (pR *Room) expelPlayerForDismissal(playerId int) {
  utils.CloseSafely(pR.PlayerDownsyncChanDict[playerId])
  pR.onPlayerExpelledForDismissal(playerId)
}

func (pR *Room) onPlayerRejoined(playerId int) {
  // TODO
}

func (pR *Room) onPlayerExpelledDuringGame(playerId int) {
}

func (pR *Room) onPlayerExpelledForDismissal(playerId int) {
  pR.DismissalWaitGroup.Done()
}

func (pR *Room) onPlayerDisconnected(playerId int) {
  /**
  * Note that there's no need to close `pR.PlayerDownsyncChanDict[playerId]` immediately.
  */
  // TODO
}

func (pR *Room) onPlayerLost(playerId int) {
  utils.CloseSafely(pR.PlayerDownsyncChanDict[playerId])
}
