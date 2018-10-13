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
	Score    float32
	State    int
	Index    int
}

func CalRoomScore(playerListCount int, capacity int, currentRoomState int) float32 {
	x := float32(playerListCount) / float32(capacity)
	return -7.8125*(x-0.2) + 5 - float32(currentRoomState)
}

