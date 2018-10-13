package models

import (
  . "server/common"
  "sync"
  "go.uber.org/zap"
	"container/heap"
	"fmt"
)

// Reference https://github.com/genxium/GoStructPrac.
var RoomHeapMux sync.Mutex
type RoomHeap []Room
var RoomHeapManagerIns RoomHeap

func (pq RoomHeap) Len() int { return len(pq) }

func (pq RoomHeap) Less(i, j int) bool {
	return pq[i].Score > pq[j].Score
}

func (pq RoomHeap) Swap(i, j int) {
	pq[i], pq[j] = pq[j], pq[i]
	pq[i].Index = i
	pq[j].Index = j
}

func (pq *RoomHeap) Push(x interface{}) {
	n := len(*pq)
	item := x.(Room)
	item.Index = n
	*pq = append(*pq, item)
}

func (pq *RoomHeap) Pop() interface{} {
	old := *pq
	n := len(old)
	if n == 0 {
		panic(fmt.Sprintf("Popping on an empty heap is not allowed.\n"))
	}
	item := old[n-1]
	item.Index = -1 // for safety
	*pq = old[0 : n-1]
	return item
}

func (pq *RoomHeap) update(item Room, Score float32) {
	item.Score = Score
	heap.Fix(pq, item.Index)
}

func InitRoomHeapManager() {
	// Init "pseudo class constants".
  InitRoomStateIns()

	initialCountOfRooms := 20
	RoomHeapManagerIns := make(RoomHeap, initialCountOfRooms)

	roomCapacity := 4
	for i := 0; i < initialCountOfRooms; i++ {
		players := make(map[int]*Player)
		currentRoomState := RoomStateIns.IDLE
		RoomHeapManagerIns[i] = Room{
			Players:  players,
			Capacity: roomCapacity,
			Score:    CalRoomScore(len(players) /* Initially 0. */, roomCapacity, currentRoomState),
			State:    currentRoomState,
			ID:       i,
			Index:    i,
		}
	}
	heap.Init(&RoomHeapManagerIns)
  Logger.Info("The RoomHeapManagerIns has been initialized.", zap.Any("RoomHeapManagerIns", RoomHeapManagerIns))
}
