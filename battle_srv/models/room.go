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
  d := (x - 0.2)
  d2 := d*d
	return -7.8125*d2 + 5.0 - float32(currentRoomState)
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
  /* TODO: Invoke r.StartBattle or update r.State accordingly. */
  return true
}

func (pR *Room) StartBattle() {
  // TODO
}

func (pR *Room) StopBattleForSettlement() {
  // TODO
}

func (pR *Room) onSettlementCompleted() {
  // TODO
}

func (pR *Room) Dismiss() {
  // TODO
}

func (pR *Room) onDismissed() {
  // TODO
}

func (pR *Room) Unicast(toPlayerId int, msg interface{}) {
  // TODO
}

func (pR *Room) Broadcast(msg interface{}) {
  // TODO
}

func (pR *Room) expelPlayer(playerId int) {
  // TODO
}

func (pR *Room) onPlayerExpelled(playerId int) {
  // TODO
}

func (pR *Room) onPlayerDisconnected(playerId int) {
  // TODO
}

func (pR *Room) onPlayerLost(playerId int) {
  // TODO
}
