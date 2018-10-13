package models

import (
)

type RoomState struct {
	IDLE          int
	WAITING       int
	IN_BATTLE     int
	IN_SETTLEMENT int
	IN_DISMISSAL  int
}

// A single instance containing only "named constant integers" to be shared by all threads.
var RoomStateIns RoomState

func calRoomScore(inRoomPlayerCount int, roomCapacity int, currentRoomState int) float32 {
	x := float32(inRoomPlayerCount) / float32(roomCapacity)
	return -7.8125*(x - 0.2) + 5.0 - float32(currentRoomState)
}

func InitRoomStateIns() {
  RoomStateIns = RoomState{
		IDLE:          0,
		WAITING:       0,
		IN_BATTLE:     9999999,
		IN_SETTLEMENT: 9999999,
		IN_DISMISSAL:  9999999,
	}
}

type Room struct {
	ID       int             `json:"id"`
	Capacity int             `json:"capacity"`
	Players  map[int]*Player `json:"players"`
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
}

func (r Room) updateScore() {
  r.Score = calRoomScore(len(r.Players), r.Capacity, r.State)
}

func (r Room) lazilyInitPlayerDownSyncChan(playerId int) {
  if r.PlayerDownsyncChanDict[playerId] != nil {
    return
  }
  r.PlayerDownsyncChanDict[playerId] = make(chan interface{}, 1024 /* Hardcoded temporarily. */)
  return
}

func (r Room) AddPlayerIfPossible(pPlayer *Player) bool {
  // TODO: Check feasibility first.
  r.Players[pPlayer.ID] = pPlayer
  r.lazilyInitPlayerDownSyncChan(pPlayer.ID)
  r.updateScore()
  /* TODO: Invoke r.StartBattle or update r.State accordingly. */
  return true
}

func (r Room) StartBattle() {
  // TODO
}

func (r Room) StopBattleForSettlement() {
  // TODO
}

func (r Room) onSettlementCompleted() {
  // TODO
}

func (r Room) Dismiss() {
  // TODO
}

func (r Room) onDismissed() {
  // TODO
}

func (r Room) Unicast(toPlayerId int, msg interface{}) {
  // TODO
}

func (r Room) Broadcast(msg interface{}) {
  // TODO
}

