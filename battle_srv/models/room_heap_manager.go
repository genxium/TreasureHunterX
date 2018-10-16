package models

import (
  . "server/common"
  "sync"
	"container/heap"
  "go.uber.org/zap"
  "fmt"
)


// Reference https://github.com/genxium/GoStructPrac.
type RoomHeap []*Room
var (
  // NOTE: For the package exported instances of non-primitive types to be accessed as singletons, they must be of pointer types. 
  RoomHeapMux *sync.Mutex
  RoomHeapManagerIns *RoomHeap
  RoomMapManagerIns map[int]*Room
)

func (pPq *RoomHeap) PrintInOrder() {
	pq := *pPq
	fmt.Printf("The RoomHeap instance now contains:\n")
	for i := 0; i < len(pq); i++ {
		fmt.Printf("{index: %d, roomID: %d, score: %.2f} ", i, pq[i].ID, pq[i].Score)
	}
	fmt.Printf("\n")
}

func (pq RoomHeap) Len() int { return len(pq) }

func (pq RoomHeap) Less(i, j int) bool {
	return pq[i].Score > pq[j].Score
}

func (pq *RoomHeap) Swap(i, j int) {
	(*pq)[i], (*pq)[j] = (*pq)[j], (*pq)[i]
	(*pq)[i].Index = i
	(*pq)[j].Index = j
}

func (pq *RoomHeap) Push(pItem interface{}) {
	// NOTE: Must take input param type `*Room` here.
	n := len(*pq)
	pItem.(*Room).Index = n
	*pq = append(*pq, pItem.(*Room))
}

func (pq *RoomHeap) Pop() interface{} {
	old := *pq
	n := len(old)
	if n == 0 {
		panic("Popping on an empty heap is not allowed.\n")
	}
	pItem := old[n-1]
  if pItem.Score <= float32(0.0) {
		panic("No available room at the moment.\n")
  }
	pItem.Index = -1 // for safety
	*pq = old[0 : n-1]
  // NOTE: Must return instance which is directly castable to type `*Room` here.
	return pItem
}

func (pq *RoomHeap) update(pItem *Room, Score float32) {
	// NOTE: Must use type `*Room` here.
	heap.Fix(pq, pItem.Index)
}

func (pq *RoomHeap) Update(pItem *Room, Score float32) {
  pq.update(pItem, Score)
}

func InitRoomHeapManager() {
  RoomHeapMux = new(sync.Mutex)
	// Init "pseudo class constants".
  InitRoomStateIns()

	initialCountOfRooms := 5
	pq := make(RoomHeap, initialCountOfRooms)
  RoomMapManagerIns := make(map[int]*Room)

	roomCapacity := 2
	for i := 0; i < initialCountOfRooms; i++ {
		currentRoomState := RoomStateIns.IDLE
		pq[i] = &Room{
			Players: make(map[int]*Player),
      PlayerDownsyncChanDict: make(map[int]chan interface{}),
			Capacity: roomCapacity,
			Score:    calRoomScore(0, roomCapacity, currentRoomState),
			State:    currentRoomState,
      CmdFromPlayersChan: nil,
			ID:       i,
			Index:    i,
      Tick:     0,
      EffectivePlayerCount: 0,
      BattleDurationNanos: int64(30*1000*1000*1000),
      ServerFPS: 30,
		}
    RoomMapManagerIns[pq[i].ID] = pq[i]
	}
	heap.Init(&pq)
  RoomHeapManagerIns = &pq
  Logger.Info("The RoomHeapManagerIns has been initialized:", zap.Any("addr", fmt.Sprintf("%p", RoomHeapManagerIns)), zap.Any("size", len(*RoomHeapManagerIns)))
  Logger.Info("The RoomMapManagerIns has been initialized:", zap.Any("size", len(RoomMapManagerIns)))
}
