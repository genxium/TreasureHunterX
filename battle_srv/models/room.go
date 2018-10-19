package models

import (
	"go.uber.org/zap"
	. "server/common"
	"server/common/utils"
	"sync"
	"time"
)

type RoomState struct {
	IDLE                           int
	WAITING                        int
	IN_BATTLE                      int
	STOPPING_BATTLE_FOR_SETTLEMENT int
	IN_SETTLEMENT                  int
	IN_DISMISSAL                   int
}

// A single instance containing only "named constant integers" to be shared by all threads.
var RoomStateIns RoomState

func calRoomScore(inRoomPlayerCount int, roomCapacity int, currentRoomState int) float32 {
	x := float32(inRoomPlayerCount) / float32(roomCapacity)
	d := (x - 0.5)
	d2 := d * d
	return -7.8125*d2 + 5.0 - float32(currentRoomState)
}

func InitRoomStateIns() {
	RoomStateIns = RoomState{
		IDLE:                           0,
		WAITING:                        -1,
		IN_BATTLE:                      10000000,
		STOPPING_BATTLE_FOR_SETTLEMENT: 10000001,
		IN_SETTLEMENT:                  10000002,
		IN_DISMISSAL:                   10000003,
	}
}

type Room struct {
	ID       int `json:"id"`
	Capacity int `json:"capacity"`
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
	PlayerDownsyncChanDict map[int]chan interface{}
	CmdFromPlayersChan     chan interface{}
	Score                  float32
	State                  int
	Index                  int
	Tick                   int
	ServerFPS              int
	BattleDurationNanos    int64
	EffectivePlayerCount   int
	DismissalWaitGroup     sync.WaitGroup
}

type RoomDownsyncFrame struct {
	ID             int             `json:"id"`
	RefFrameID     int             `json:"refFrameId"`
	Players        map[int]*Player `json:"players"`
	SentAt         int64           `json:"sentAt"`
	CountdownNanos int64           `json:"countdownNanos"`
}

func (pR *Room) updateScore() {
	pR.Score = calRoomScore(pR.EffectivePlayerCount, pR.Capacity, pR.State)
}

func (pR *Room) AddPlayerIfPossible(pPlayer *Player) bool {
	if RoomStateIns.IDLE != pR.State && RoomStateIns.WAITING != pR.State {
		Logger.Error("AddPlayerIfPossible error, roomState:", zap.Any("playerId", pPlayer.ID), zap.Any("roomID", pR.ID), zap.Any("roomState", pR.State), zap.Any("roomEffectivePlayerCount", pR.EffectivePlayerCount))
		return false
	}
	if _, existent := pR.Players[pPlayer.ID]; existent {
		Logger.Error("AddPlayerIfPossible error, existing in the room.PlayersDict:", zap.Any("playerId", pPlayer.ID), zap.Any("roomID", pR.ID), zap.Any("roomState", pR.State), zap.Any("roomEffectivePlayerCount", pR.EffectivePlayerCount))
		return false
	}
	defer pR.onPlayerAdded(pPlayer.ID)
	pR.Players[pPlayer.ID] = pPlayer
	// Always instantiates a new channel and let the old one die out due to not being retained by any root reference.
	pR.PlayerDownsyncChanDict[pPlayer.ID] = make(chan interface{}, 1024 /* Hardcoded temporarily. */)
	return true
}

func (pR *Room) ReAddPlayerIfPossible(pPlayer *Player) bool {
	if RoomStateIns.WAITING != pR.State && RoomStateIns.IN_BATTLE != pR.State && RoomStateIns.IN_SETTLEMENT != pR.State {
		Logger.Error("ReAddPlayerIfPossible error, roomState:", zap.Any("playerId", pPlayer.ID), zap.Any("roomID", pR.ID), zap.Any("roomState", pR.State), zap.Any("roomEffectivePlayerCount", pR.EffectivePlayerCount))
		return false
	}
	if _, existent := pR.Players[pPlayer.ID]; !existent {
		Logger.Error("ReAddPlayerIfPossible error, nonexistent:", zap.Any("playerId", pPlayer.ID), zap.Any("roomID", pR.ID), zap.Any("roomState", pR.State), zap.Any("roomEffectivePlayerCount", pR.EffectivePlayerCount))
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
	// Always instantiates a new channel and let the old one die out due to not being retained by any root reference.
	pR.CmdFromPlayersChan = make(chan interface{}, 2048 /* Hardcoded temporarily. */)
	nanosPerFrame := 1000000000 / int64(pR.ServerFPS)
	pR.Tick = 0
	/**
	 * Will be triggered from a goroutine which executes the critical `Room.AddPlayerIfPossible`, thus the `battleMainLoop` should be detached.
	 * All of the consecutive stages, e.g. settlement, dismissal, should share the same goroutine with `battleMainLoop`.
	 */
	battleMainLoop := func() {
		defer func() {
			Logger.Info("The `battleMainLoop` is stopped for:", zap.Any("roomID", pR.ID))
			pR.onBattleStoppedForSettlement()
		}()
		battleMainLoopStartedNanos := utils.UnixtimeNano()
		var totalElapsedNanos int64
		totalElapsedNanos = 0
		for {
			if totalElapsedNanos > pR.BattleDurationNanos {
				pR.StopBattleForSettlement()
			}
			if RoomStateIns.IN_BATTLE != pR.State {
				// TODO: Replace with `pRoomState = (&pR.State)` and `atomic.CompareAndSwapInt32(...) on pRoomState`.
				return
			}
			pR.Tick++
			stCalculation := utils.UnixtimeNano()
			for playerId, _ := range pR.Players {
				assembledFrame := &RoomDownsyncFrame{
					ID:             pR.Tick,
					RefFrameID:     0, // Hardcoded for now.
					Players:        pR.Players,
					SentAt:         utils.UnixtimeMilli(),
					CountdownNanos: (pR.BattleDurationNanos - totalElapsedNanos),
				}
				theForwardingChannel := pR.PlayerDownsyncChanDict[playerId]
				// Logger.Info("Sending RoomDownsyncFrame in battleMainLoop:", zap.Any("RoomDownsyncFrame", assembledFrame), zap.Any("roomID", pR.ID), zap.Any("playerId", playerId))
				utils.SendSafely(assembledFrame, theForwardingChannel)
			}
			now := utils.UnixtimeNano()
			elapsedInCalculation := now - stCalculation
			totalElapsedNanos = (now - battleMainLoopStartedNanos)
			// Logger.Info("Elapsed time statistics:", zap.Any("roomID", pR.ID), zap.Any("elapsedInCalculation", elapsedInCalculation), zap.Any("totalElapsedNanos", totalElapsedNanos))
			time.Sleep(time.Duration(nanosPerFrame - elapsedInCalculation))
		}
	}

	cmdReceivingLoop := func() {
		defer func() {
			if r := recover(); r != nil {
				Logger.Warn("Room cmdReceivingLoop, recovery spot#1, recovered from: ", zap.Any("roomId", pR.ID), zap.Any("panic", r))
			}
			Logger.Info("The `cmdReceivingLoop` is stopped for:", zap.Any("roomID", pR.ID))
		}()
		for {
			if RoomStateIns.IN_BATTLE != pR.State {
				// TODO: Replace with `pRoomState = (&pR.State)` and `atomic.CompareAndSwapInt32(...) on pRoomState`.
				return
			}
			// stCalculation := utils.UnixtimeNano()
			select {
			case tmp, _ := <-pR.CmdFromPlayersChan:
				if nil == tmp {
					break
				}
				immediatePlayerData := tmp.(*Player)
				if nil == immediatePlayerData {
					break
				}
				// Logger.Info("Room received `immediatePlayerData`:", zap.Any("immediatePlayerData", immediatePlayerData), zap.Any("roomID", pR.ID))
				// Update immediate player info for broadcasting or unicasting.
				pR.Players[immediatePlayerData.ID].X = immediatePlayerData.X
				pR.Players[immediatePlayerData.ID].Y = immediatePlayerData.Y
				pR.Players[immediatePlayerData.ID].Dir.Dx = immediatePlayerData.Dir.Dx
				pR.Players[immediatePlayerData.ID].Dir.Dy = immediatePlayerData.Dir.Dy
			default:
			}
			// elapsedInCalculation := utils.UnixtimeNano() - stCalculation
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
	pR.Tick++
	for playerId, _ := range pR.Players {
		assembledFrame := &RoomDownsyncFrame{
			ID:             pR.Tick,
			RefFrameID:     0, // Hardcoded for now.
			Players:        pR.Players,
			SentAt:         utils.UnixtimeMilli(),
			CountdownNanos: -1, // TODO: Replace this magic constant!
		}
		theForwardingChannel := pR.PlayerDownsyncChanDict[playerId]
		utils.SendSafely(assembledFrame, theForwardingChannel)
	}
	// Note that `pR.onBattleStoppedForSettlement` will be called by `battleMainLoop`.
}

func (pR *Room) onBattleStarted() {
	if RoomStateIns.WAITING != pR.State {
		return
	}
	pR.State = RoomStateIns.IN_BATTLE
	Logger.Info("The `battleMainLoop` is started for:", zap.Any("roomID", pR.ID))
	pR.updateScore()
}

func (pR *Room) onBattleStoppedForSettlement() {
	if RoomStateIns.STOPPING_BATTLE_FOR_SETTLEMENT != pR.State {
		return
	}
	defer func() {
		pR.onSettlementCompleted()
	}()
	pR.State = RoomStateIns.IN_SETTLEMENT
	Logger.Info("The room is in settlement:", zap.Any("roomID", pR.ID))
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
	Logger.Info("The room is in dismissal:", zap.Any("roomID", pR.ID))
	pR.DismissalWaitGroup.Wait()
	pR.onDismissed()
}

func (pR *Room) onDismissed() {
	Logger.Info("The room is completely dismissed:", zap.Any("roomID", pR.ID))
	pR.State = RoomStateIns.IDLE
	pR.EffectivePlayerCount = 0

	// Always instantiates new HeapRAM blocks and let the old blocks die out due to not being retained by any root reference.
	pR.Players = make(map[int]*Player)
	pR.PlayerDownsyncChanDict = make(map[int]chan interface{})
	pR.CmdFromPlayersChan = nil
	pR.updateScore()
}

func (pR *Room) Unicast(toPlayerId int, msg interface{}) {
	// TODO
}

func (pR *Room) Broadcast(msg interface{}) {
	// TODO
}

func (pR *Room) expelPlayerDuringGame(playerId int) {
	defer pR.onPlayerExpelledDuringGame(playerId)
}

func (pR *Room) expelPlayerForDismissal(playerId int) {
	pR.onPlayerExpelledForDismissal(playerId)
}

func (pR *Room) onPlayerExpelledDuringGame(playerId int) {
	pR.onPlayerLost(playerId)
}

func (pR *Room) onPlayerExpelledForDismissal(playerId int) {
	assembledFrame := &RoomDownsyncFrame{
		ID:             -1, // TODO: Replace this magic constant!
		RefFrameID:     0,  // Hardcoded for now.
		Players:        nil,
		SentAt:         utils.UnixtimeMilli(),
		CountdownNanos: -1,
	}
	theForwardingChannel := pR.PlayerDownsyncChanDict[playerId]
	utils.SendSafely(assembledFrame, theForwardingChannel)
	pR.onPlayerLost(playerId)
	pR.DismissalWaitGroup.Done()

	Logger.Info("Player expelled for dismissal:", zap.Any("playerId", playerId), zap.Any("roomID", pR.ID), zap.Any("nowRoomState", pR.State), zap.Any("nowRoomEffectivePlayerCount", pR.EffectivePlayerCount))
}

func (pR *Room) OnPlayerDisconnected(playerId int) {
	/**
	 * Note that there's no need to close `pR.PlayerDownsyncChanDict[playerId]` immediately.
	 */
	switch pR.State {
	case RoomStateIns.WAITING:
		pR.onPlayerLost(playerId)
		if pR.EffectivePlayerCount == 0 {
			pR.State = RoomStateIns.IDLE
		}
		pR.updateScore()
		Logger.Info("Player disconnected while room is at RoomStateIns.WAITING:", zap.Any("playerId", playerId), zap.Any("roomID", pR.ID), zap.Any("nowRoomState", pR.State), zap.Any("nowRoomEffectivePlayerCount", pR.EffectivePlayerCount))
		break
	default:
		break
	}
}

func (pR *Room) onPlayerLost(playerId int) {
	if _, existent := pR.Players[playerId]; existent {
		delete(pR.Players, playerId)
		utils.CloseSafely(pR.PlayerDownsyncChanDict[playerId])
		delete(pR.PlayerDownsyncChanDict, playerId)
		pR.EffectivePlayerCount--
	}
}

func (pR *Room) onPlayerAdded(playerId int) {
	pR.EffectivePlayerCount++
	if pR.EffectivePlayerCount == 1 {
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
