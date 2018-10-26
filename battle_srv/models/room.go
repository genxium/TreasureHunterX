package models

import (
	"go.uber.org/zap"
	. "server/common"
	"server/common/utils"
	"sync"
	"time"
  "github.com/Tarliton/collision2d"
)

type RoomBattleState struct {
	IDLE                           int
	WAITING                        int
	IN_BATTLE                      int
	STOPPING_BATTLE_FOR_SETTLEMENT int
	IN_SETTLEMENT                  int
	IN_DISMISSAL                   int
}

// A single instance containing only "named constant integers" to be shared by all threads.
var RoomBattleStateIns RoomBattleState

func InitRoomBattleStateIns() {
	RoomBattleStateIns = RoomBattleState{
		IDLE:                           0,
		WAITING:                        -1,
		IN_BATTLE:                      10000000,
		STOPPING_BATTLE_FOR_SETTLEMENT: 10000001,
		IN_SETTLEMENT:                  10000002,
		IN_DISMISSAL:                   10000003,
	}
}

func calRoomScore(inRoomPlayerCount int, roomCapacity int, currentRoomBattleState int) float32 {
	x := float32(inRoomPlayerCount) / float32(roomCapacity)
	d := (x - 0.5)
	d2 := d * d
	return -7.8125*d2 + 5.0 - float32(currentRoomBattleState)
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
  Treasures              map[int]*Treasure
}

type RoomDownsyncFrame struct {
	ID             int             `json:"id"`
	RefFrameID     int             `json:"refFrameId"`
	Players        map[int]*Player `json:"players"`
	SentAt         int64           `json:"sentAt"`
	CountdownNanos int64           `json:"countdownNanos"`
  Treasures      map[int]*Treasure `json:"treasures"`
}

func (pR *Room) updateScore() {
	pR.Score = calRoomScore(pR.EffectivePlayerCount, pR.Capacity, pR.State)
}

func (pR *Room) AddPlayerIfPossible(pPlayer *Player) bool {
	if RoomBattleStateIns.IDLE != pR.State && RoomBattleStateIns.WAITING != pR.State {
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
  pPlayer.BattleState = PlayerBattleStateIns.ACTIVE
  pPlayer.Speed = 300; // Hardcoded temporarily.
	return true
}

func (pR *Room) ReAddPlayerIfPossible(pPlayer *Player) bool {
	if RoomBattleStateIns.WAITING != pR.State && RoomBattleStateIns.IN_BATTLE != pR.State && RoomBattleStateIns.IN_SETTLEMENT != pR.State {
		Logger.Error("ReAddPlayerIfPossible error, roomState:", zap.Any("playerId", pPlayer.ID), zap.Any("roomID", pR.ID), zap.Any("roomState", pR.State), zap.Any("roomEffectivePlayerCount", pR.EffectivePlayerCount))
		return false
	}
	if _, existent := pR.Players[pPlayer.ID]; !existent {
		Logger.Error("ReAddPlayerIfPossible error, nonexistent:", zap.Any("playerId", pPlayer.ID), zap.Any("roomID", pR.ID), zap.Any("roomState", pR.State), zap.Any("roomEffectivePlayerCount", pR.EffectivePlayerCount))
		return false
	}
	defer pR.onPlayerReAdded(pPlayer.ID)
  pPlayer.BattleState = PlayerBattleStateIns.ACTIVE
	// Note: All previous position and orientation info should just be recovered.
	return true
}

func (pR *Room) createTreasure(pAnchor *Vec2D, treasureLocalIDInBattle int) *Treasure {
  thePoints := make([]*Vec2D, 5)
  thePoints[0] = &Vec2D{
    X: float64(0),
    Y: float64(100),
  }
  thePoints[1] = &Vec2D{
    X: float64(-100),
    Y: float64(0),
  }
  thePoints[2] = &Vec2D{
    X: float64(-100),
    Y: float64(-100),
  }
  thePoints[3] = &Vec2D{
    X: float64(+100),
    Y: float64(-100),
  }
  thePoints[4] = &Vec2D{
    X: float64(+100),
    Y: float64(0),
  }
  thePolygon := Polygon2D{
    Anchor: pAnchor,
    Points: thePoints,
  }
  theTreasure := Treasure{
    ID: 0,
    LocalIDInBattle: treasureLocalIDInBattle,
    Score: 100,
    PickupBoundary: &thePolygon,
  }

  return &theTreasure
}

func (pR *Room) InitTreasures() {
  pR.Treasures = make(map[int]*Treasure, 1)
  {
    pAnchor := &Vec2D{
      X: float64(200),
      Y: float64(200),
    }
    theTreasure := pR.createTreasure(pAnchor, 0)
    pR.Treasures[theTreasure.LocalIDInBattle] = theTreasure
  }
  {
    pAnchor := &Vec2D{
      X: float64(-200),
      Y: float64(-200),
    }
    theTreasure := pR.createTreasure(pAnchor, 1)
    pR.Treasures[theTreasure.LocalIDInBattle] = theTreasure
  }
  {
    pAnchor := &Vec2D{
      X: float64(200),
      Y: float64(-200),
    }
    theTreasure := pR.createTreasure(pAnchor, 2)
    pR.Treasures[theTreasure.LocalIDInBattle] = theTreasure
  }
  Logger.Info("InitTreasures finished:", zap.Any("roomID", pR.ID), zap.Any("treasures", pR.Treasures))
}

func (pR *Room) StartBattle() {
	if RoomBattleStateIns.WAITING != pR.State {
		return
	}

  pR.InitTreasures()

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
			if RoomBattleStateIns.IN_BATTLE != pR.State {
				// TODO: Replace with `pRoomBattleState = (&pR.State)` and `atomic.CompareAndSwapInt32(...) on pRoomBattleState`.
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
          Treasures:      pR.Treasures,
				}
				theForwardingChannel := pR.PlayerDownsyncChanDict[playerId]
				// Logger.Info("Sending RoomDownsyncFrame in battleMainLoop:", zap.Any("RoomDownsyncFrame", assembledFrame), zap.Any("roomID", pR.ID), zap.Any("playerId", playerId))
				utils.SendSafely(assembledFrame, theForwardingChannel)
			}

      // Collision detection & resolution.
			for treasureLocalIDInBattle, treasure := range pR.Treasures {
        treasureColliderPointsCount := len(treasure.PickupBoundary.Points)
        treasureColliderPoints := make([]float64, 2*treasureColliderPointsCount)
        for i, pt := range treasure.PickupBoundary.Points {
          treasureColliderPoints[2*i] = pt.X
          treasureColliderPoints[2*i + 1] = pt.Y
        }
        treasureCollider := collision2d.NewPolygon(
          collision2d.Vector{treasure.PickupBoundary.Anchor.X, treasure.PickupBoundary.Anchor.Y},
          collision2d.Vector{0.0, 0.0},
          0.0,
          treasureColliderPoints[:])
        treasureRemoved := false
        for _, player := range pR.Players {
          playerCollider := collision2d.Circle{collision2d.Vector{player.X, player.Y}, 32.0} // Hardcoded for now
          result, _ := collision2d.TestPolygonCircle(treasureCollider, playerCollider)
          if result {
            Logger.Info("Treasure is picked up by player:", zap.Any("playerId", player.ID), zap.Any("treasureLocalIDInBattle", treasureLocalIDInBattle))
            treasureRemoved = true
            break
          }
        }
        if treasureRemoved {
          delete (pR.Treasures, treasureLocalIDInBattle)
          continue
        }
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
				Logger.Error("Room cmdReceivingLoop, recovery spot#1, recovered from: ", zap.Any("roomId", pR.ID), zap.Any("panic", r))
			}
			Logger.Info("The `cmdReceivingLoop` is stopped for:", zap.Any("roomID", pR.ID))
		}()
		for {
			if RoomBattleStateIns.IN_BATTLE != pR.State {
				// TODO: Replace with `pRoomBattleState = (&pR.State)` and `atomic.CompareAndSwapInt32(...) on pRoomBattleState`.
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
        if _, existent := pR.Players[immediatePlayerData.ID]; !existent {
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
	if RoomBattleStateIns.IN_BATTLE != pR.State {
		return
	}
	pR.State = RoomBattleStateIns.STOPPING_BATTLE_FOR_SETTLEMENT
	Logger.Info("Stopping the `battleMainLoop` for:", zap.Any("roomID", pR.ID))
	pR.Tick++
	for playerId, _ := range pR.Players {
		assembledFrame := &RoomDownsyncFrame{
			ID:             pR.Tick,
			RefFrameID:     0, // Hardcoded for now.
			Players:        pR.Players,
			SentAt:         utils.UnixtimeMilli(),
			CountdownNanos: -1, // TODO: Replace this magic constant!
      Treasures:      pR.Treasures,
		}
		theForwardingChannel := pR.PlayerDownsyncChanDict[playerId]
		utils.SendSafely(assembledFrame, theForwardingChannel)
	}
	// Note that `pR.onBattleStoppedForSettlement` will be called by `battleMainLoop`.
}

func (pR *Room) onBattleStarted() {
	if RoomBattleStateIns.WAITING != pR.State {
		return
	}
	pR.State = RoomBattleStateIns.IN_BATTLE
	Logger.Info("The `battleMainLoop` is started for:", zap.Any("roomID", pR.ID))
	pR.updateScore()
}

func (pR *Room) onBattleStoppedForSettlement() {
	if RoomBattleStateIns.STOPPING_BATTLE_FOR_SETTLEMENT != pR.State {
		return
	}
	defer func() {
		pR.onSettlementCompleted()
	}()
	pR.State = RoomBattleStateIns.IN_SETTLEMENT
	Logger.Info("The room is in settlement:", zap.Any("roomID", pR.ID))
	// TODO: Some settlement labor.
}

func (pR *Room) onSettlementCompleted() {
	pR.Dismiss()
}

func (pR *Room) Dismiss() {
	if RoomBattleStateIns.IN_SETTLEMENT != pR.State {
		return
	}
	pR.State = RoomBattleStateIns.IN_DISMISSAL
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
	pR.State = RoomBattleStateIns.IDLE
	pR.EffectivePlayerCount = 0

	// Always instantiates new HeapRAM blocks and let the old blocks die out due to not being retained by any root reference.
	pR.Players = make(map[int]*Player)
	pR.Treasures = make(map[int]*Treasure)
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
    Treasures:      pR.Treasures,
	}
	theForwardingChannel := pR.PlayerDownsyncChanDict[playerId]
	utils.SendSafely(assembledFrame, theForwardingChannel)
	pR.onPlayerLost(playerId)
	pR.DismissalWaitGroup.Done()

	Logger.Info("Player expelled for dismissal:", zap.Any("playerId", playerId), zap.Any("roomID", pR.ID), zap.Any("nowRoomBattleState", pR.State), zap.Any("nowRoomEffectivePlayerCount", pR.EffectivePlayerCount))
}

func (pR *Room) OnPlayerDisconnected(playerId int) {
  defer func() {
    if r := recover(); r != nil {
      Logger.Error("Room OnPlayerDisconnected, recovery spot#1, recovered from: ", zap.Any("playerId", playerId), zap.Any("roomId", pR.ID), zap.Any("panic", r))
    }
  }()
	/**
	 * Note that there's no need to close `pR.PlayerDownsyncChanDict[playerId]` immediately.
	 */
	switch pR.State {
	case RoomBattleStateIns.WAITING:
		pR.onPlayerLost(playerId)
    delete (pR.Players, playerId) // Note that this statement MUST be put AFTER `pR.onPlayerLost(...)` to avoid nil pointer exception.
		if pR.EffectivePlayerCount == 0 {
			pR.State = RoomBattleStateIns.IDLE
		}
		pR.updateScore()
		Logger.Info("Player disconnected while room is at RoomBattleStateIns.WAITING:", zap.Any("playerId", playerId), zap.Any("roomID", pR.ID), zap.Any("nowRoomBattleState", pR.State), zap.Any("nowRoomEffectivePlayerCount", pR.EffectivePlayerCount))
		break
	default:
    if _, existent := pR.Players[playerId]; existent {
      pR.Players[playerId].BattleState = PlayerBattleStateIns.DISCONNECTED
      Logger.Info("Player is just disconnected from room:", zap.Any("playerId", playerId), zap.Any("playerBattleState", pR.Players[playerId].BattleState), zap.Any("roomID", pR.ID), zap.Any("nowRoomBattleState", pR.State), zap.Any("nowRoomEffectivePlayerCount", pR.EffectivePlayerCount))
    }
		break
	}
}

func (pR *Room) onPlayerLost(playerId int) {
	if _, existent := pR.Players[playerId]; existent {
    pR.Players[playerId].BattleState = PlayerBattleStateIns.LOST
		utils.CloseSafely(pR.PlayerDownsyncChanDict[playerId])
		delete(pR.PlayerDownsyncChanDict, playerId)
		pR.EffectivePlayerCount--
	}
}

func (pR *Room) onPlayerAdded(playerId int) {
	pR.EffectivePlayerCount++
	if pR.EffectivePlayerCount == 1 {
		pR.State = RoomBattleStateIns.WAITING
	}
	pR.updateScore()
	Logger.Info("Player added:", zap.Any("playerId", playerId), zap.Any("roomID", pR.ID), zap.Any("EffectivePlayerCount", pR.EffectivePlayerCount), zap.Any("RoomBattleState", pR.State))
	if pR.Capacity == len(pR.Players) {
		pR.StartBattle()
	}
}

func (pR *Room) onPlayerReAdded(playerId int) {
	// TODO
}
