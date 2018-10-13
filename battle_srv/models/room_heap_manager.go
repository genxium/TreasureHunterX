package models

import (
  . "server/common"
  "sync"
	"container/heap"
  "go.uber.org/zap"
  "fmt"
)


// Reference https://github.com/genxium/GoStructPrac.
type RoomHeap []Room
var (
  RoomHeapMux sync.Mutex
  // NOTE: For the package exported instances of non-primitive types to be accessed as singletons, they must be of pointer types. 
  RoomHeapManagerIns *RoomHeap
)

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
		panic("Popping on an empty heap is not allowed.")
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

func (pq *RoomHeap) Update(item Room, Score float32) {
  pq.update(item, Score)
}

func InitRoomHeapManager() {
	// Init "pseudo class constants".
  InitRoomStateIns()

	initialCountOfRooms := 20
	pq := make(RoomHeap, initialCountOfRooms)

	roomCapacity := 4
	for i := 0; i < initialCountOfRooms; i++ {
		players := make(map[int]*Player)
    playerDownsyncChanDict := make(map[int]chan interface{})
		currentRoomState := RoomStateIns.IDLE
		pq[i] = Room{
			Players:  players,
      PlayerDownsyncChanDict: playerDownsyncChanDict,
			Capacity: roomCapacity,
			Score:    calRoomScore(len(players) /* Initially 0. */, roomCapacity, currentRoomState),
			State:    currentRoomState,
      CmdFromPlayersChan: make(chan interface{}, 2048 /* Hardcoded temporarily. */),
			ID:       i,
			Index:    i,
		}
	}
	heap.Init(&pq)
  RoomHeapManagerIns = &pq
  Logger.Info("The RoomHeapManagerIns has been initialized:", zap.Any("addr", fmt.Sprintf("%p", RoomHeapManagerIns)), zap.Any("size", len(*RoomHeapManagerIns)))
}
