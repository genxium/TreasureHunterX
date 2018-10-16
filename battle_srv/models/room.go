package models

import (
  "time"
  "sync"
  "go.uber.org/zap"
  . "server/common"
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
		WAITING:       -1,
		IN_BATTLE:     10000000,
		STOPPING_BATTLE_FOR_SETTLEMENT:  10000001,
		IN_SETTLEMENT: 10000002,
		IN_DISMISSAL:  10000003,
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
  BattleDurationMillis int64
  EffectivePlayerCount int
  DismissalWaitGroup sync.WaitGroup
}

type RoomDownsyncFrame struct {
  ID    int   `json:"id"`
  RefFrameID    int   `json:"refFrameId"`
  Players       map[int]*Player  `json:"players"`
  SentAt        int64 `json:"sentAt"`
  CountdownMillis int64 `json:"countdownMillis"`
}

func (pR *Room) updateScore() {
	pR.Score = calRoomScore(len(pR.Players), pR.Capacity, pR.State)
}

func (pR *Room) lazilyInitPlayerDownSyncChan(playerId int) {
  r := *pR
  if _, existent := r.PlayerDownsyncChanDict[playerId]; existent {
    return
  }
  r.PlayerDownsyncChanDict[playerId] = make(chan interface{}, 1024 /* Hardcoded temporarily. */)
  return
}

func (pR *Room) AddPlayerIfPossible(pPlayer *Player) bool {
  if RoomStateIns.IDLE != pR.State && RoomStateIns.WAITING != pR.State {
    return false
  }
  if _, existent := pR.Players[pPlayer.ID]; existent {
    return false
  }
  defer pR.onPlayerAdded(pPlayer.ID)
  pR.Players[pPlayer.ID] = pPlayer
  pR.lazilyInitPlayerDownSyncChan(pPlayer.ID)
  return true
}

func (pR *Room) ReAddPlayerIfPossible(pPlayer *Player) bool {
  if RoomStateIns.WAITING != pR.State && RoomStateIns.IN_BATTLE != pR.State && RoomStateIns.IN_SETTLEMENT != pR.State {
    return false
  }
  if _, existent := pR.Players[pPlayer.ID]; !existent {
    return false
  }
  defer pR.onPlayerReAdded(pPlayer.ID)
  // Note: All previous position and orientation info should just be recovered.
  return true
}

func (pR *Room) StartBattle() {
  if RoomStateIns.WAITING != pR.State {
    return
  }
  millisPerFrame := 1000/int64(pR.ServerFPS)
  twiceMillisPerFrame := 2*millisPerFrame
  pR.Tick = 0
  /**
  * Will be triggered from a goroutine which executes the critical `Room.AddPlayerIfPossible`, thus the `battleMainLoop` should be detached. 
  * All of the consecutive stages, e.g. settlement, dismissal, should share the same goroutine with `battleMainLoop`.
  */
  battleMainLoop := func () {
    defer func() {
      Logger.Info("The `battleMainLoop` is stopped for:", zap.Any("roomID", pR.ID))
      pR.onBattleStoppedForSettlement()
    }()
    var totalElapsedMillis int64
    totalElapsedMillis = 0
    for {
      if totalElapsedMillis > pR.BattleDurationMillis {
        pR.StopBattleForSettlement()
      }
      if RoomStateIns.IN_BATTLE != pR.State {
        return
      }
      pR.Tick++
      stCalculation := utils.UnixtimeMilli()
      for playerId, _ := range pR.Players {
        assembledFrame := &RoomDownsyncFrame{
          ID: pR.Tick,
          RefFrameID: 0, // Hardcoded for now.
          Players: pR.Players,
          SentAt: utils.UnixtimeMilli(),
          CountdownMillis: (pR.BattleDurationMillis - totalElapsedMillis),
        }
        theForwardingChannel := pR.PlayerDownsyncChanDict[playerId]
        utils.SendSafely(assembledFrame, theForwardingChannel)
      }
      elapsedMillisInCalculation := utils.UnixtimeMilli() - stCalculation
      totalElapsedMillis += elapsedMillisInCalculation
      time.Sleep(time.Millisecond * time.Duration(millisPerFrame - elapsedMillisInCalculation))
    }
  }

  cmdReceivingLoop := func() {
    defer func() {
      Logger.Info("The `cmdReceivingLoop` is stopped for:", zap.Any("roomID", pR.ID))
    }()
    for {
      if (RoomStateIns.IN_BATTLE != pR.State) {
        return
      }
      stCalculation := utils.UnixtimeMilli()
      hasMoreToRead := false
      for {
        select {
          case tmp, tmpHasMoreToRead := <-pR.CmdFromPlayersChan:
            immediatePlayerData := tmp.(*Player)
            // Logger.Info("Room received `immediatePlayerData`:", zap.Any("immediatePlayerData", immediatePlayerData), zap.Any("roomID", pR.ID))
            // Update immediate player info for broadcasting or unicasting.
            pR.Players[immediatePlayerData.ID].X = immediatePlayerData.X
            pR.Players[immediatePlayerData.ID].Y = immediatePlayerData.Y
            pR.Players[immediatePlayerData.ID].Dir.Dx = immediatePlayerData.Dir.Dx
            pR.Players[immediatePlayerData.ID].Dir.Dy = immediatePlayerData.Dir.Dy
            hasMoreToRead = tmpHasMoreToRead
          default:
        }
        if !hasMoreToRead {
          break
        }
      }
      elapsedMillisInCalculation := utils.UnixtimeMilli() - stCalculation
      time.Sleep(time.Millisecond * time.Duration(twiceMillisPerFrame - elapsedMillisInCalculation))
    }
  }

  pR.onBattleStarted() // NOTE: Deliberately not using `defer`.
  go cmdReceivingLoop()
  go battleMainLoop()
}

func (pR *Room) StopBattleForSettlement() {
  if RoomStateIns.IN_BATTLE != pR.State {
    return
  }
  pR.State = RoomStateIns.STOPPING_BATTLE_FOR_SETTLEMENT
  Logger.Info("Stopping the `battleMainLoop` for:", zap.Any("roomID", pR.ID))
  // Note that `pR.onBattleStoppedForSettlement` will be called by `battleMainLoop`.
}

func (pR *Room) onBattleStarted() {
  if RoomStateIns.WAITING != pR.State {
    return
  }
  pR.State = RoomStateIns.IN_BATTLE
  Logger.Info("The `battleMainLoop` is started for:", zap.Any("roomID", pR.ID))
}

func (pR *Room) onBattleStoppedForSettlement() {
  if RoomStateIns.STOPPING_BATTLE_FOR_SETTLEMENT != pR.State {
    return
  }
  defer func() {
    pR.onSettlementCompleted()
  }()
  pR.State = RoomStateIns.IN_SETTLEMENT
  // TODO: Some settlement labor.
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
  pR.EffectivePlayerCount = 0
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
  defer pR.onPlayerExpelledDuringGame(playerId)
  utils.CloseSafely(pR.PlayerDownsyncChanDict[playerId])
}

func (pR *Room) expelPlayerForDismissal(playerId int) {
  utils.CloseSafely(pR.PlayerDownsyncChanDict[playerId])
  pR.onPlayerExpelledForDismissal(playerId)
}

func (pR *Room) onPlayerExpelledDuringGame(playerId int) {
  pR.EffectivePlayerCount--
}

func (pR *Room) onPlayerExpelledForDismissal(playerId int) {
  pR.EffectivePlayerCount--
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
  pR.EffectivePlayerCount--
}

func (pR *Room) onPlayerAdded(playerId int) {
  pR.EffectivePlayerCount++
  if (pR.EffectivePlayerCount == 1) {
    pR.State = RoomStateIns.WAITING
  }
  pR.updateScore()
  Logger.Info("Player added:", zap.Any("playerId", playerId), zap.Any("roomID", pR.ID), zap.Any("EffectivePlayerCount", pR.EffectivePlayerCount), zap.Any("RoomState", pR.State))
  if pR.Capacity == len(pR.Players) {
    pR.StartBattle()
  }
}

func (pR *Room) onPlayerReAdded(playerId int) {
  // TODO
}
