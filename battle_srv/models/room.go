package models

import (
	"encoding/xml"
	"fmt"
	"github.com/ByteArena/box2d"
	"github.com/golang/protobuf/proto"
	"go.uber.org/zap"
	"io/ioutil"
	"math"
	"math/rand"
	"net/http"
	"os"
	"path/filepath"
	. "server/common"
	"server/common/utils"
	pb "server/pb_output"
	"sync"
	"time"
)

const (
	MAGIC_REMOVED_AT_FRAME_ID_PERMANENT_REMOVAL_MARGIN    = 5
	MAGIC_ROOM_DOWNSYNC_FRAME_ID_BATTLE_READY_TO_START    = -99
	MAGIC_ROOM_DOWNSYNC_FRAME_ID_PLAYER_ADDED_AND_ACKED   = -98
	MAGIC_ROOM_DOWNSYNC_FRAME_ID_PLAYER_READDED_AND_ACKED = -97

	MAGIC_JOIN_INDEX_DEFAULT = 0
	MAGIC_JOIN_INDEX_INVALID = -1
)

const (
	// You can equivalently use the `GroupIndex` approach, but the more complicated and general purpose approach is used deliberately here. Reference http://www.aurelienribon.com/post/2011-07-box2d-tutorial-collision-filtering.
	COLLISION_CATEGORY_CONTROLLED_PLAYER = (1 << 1)
	COLLISION_CATEGORY_TREASURE          = (1 << 2)
	COLLISION_CATEGORY_TRAP              = (1 << 3)
	COLLISION_CATEGORY_TRAP_BULLET       = (1 << 4)
	COLLISION_CATEGORY_BARRIER           = (1 << 5)
	COLLISION_CATEGORY_PUMPKIN           = (1 << 6)
	COLLISION_CATEGORY_SPEED_SHOES       = (1 << 7)

	COLLISION_MASK_FOR_CONTROLLED_PLAYER = (COLLISION_CATEGORY_TREASURE | COLLISION_CATEGORY_TRAP | COLLISION_CATEGORY_TRAP_BULLET | COLLISION_CATEGORY_SPEED_SHOES)
	COLLISION_MASK_FOR_TREASURE          = (COLLISION_CATEGORY_CONTROLLED_PLAYER)
	COLLISION_MASK_FOR_TRAP              = (COLLISION_CATEGORY_CONTROLLED_PLAYER)
	COLLISION_MASK_FOR_TRAP_BULLET       = (COLLISION_CATEGORY_CONTROLLED_PLAYER)
	COLLISION_MASK_FOR_BARRIER           = (COLLISION_CATEGORY_PUMPKIN)
	COLLISION_MASK_FOR_PUMPKIN           = (COLLISION_CATEGORY_BARRIER)
	COLLISION_MASK_FOR_SPEED_SHOES       = (COLLISION_CATEGORY_CONTROLLED_PLAYER)
)

type RoomBattleState struct {
	IDLE                           int32
	WAITING                        int32
	PREPARE                        int32
	IN_BATTLE                      int32
	STOPPING_BATTLE_FOR_SETTLEMENT int32
	IN_SETTLEMENT                  int32
	IN_DISMISSAL                   int32
}

// A single instance containing only "named constant integers" to be shared by all threads.
var RoomBattleStateIns RoomBattleState

func InitRoomBattleStateIns() {
	RoomBattleStateIns = RoomBattleState{
		IDLE:                           0,
		WAITING:                        -1,
		PREPARE:                        10000000,
		IN_BATTLE:                      10000001,
		STOPPING_BATTLE_FOR_SETTLEMENT: 10000002,
		IN_SETTLEMENT:                  10000003,
		IN_DISMISSAL:                   10000004,
	}
}

func calRoomScore(inRoomPlayerCount int32, roomCapacity int, currentRoomBattleState int32) float32 {
	x := float32(inRoomPlayerCount) / float32(roomCapacity)
	d := (x - 0.5)
	d2 := d * d
	return -7.8125*d2 + 5.0 - float32(currentRoomBattleState)
}

type Room struct {
	Id       int32
	Capacity int
	Players  map[int32]*Player
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
	PlayerDownsyncChanDict       map[int32]chan string
	CmdFromPlayersChan           chan interface{}
	Score                        float32
	State                        int32
	Index                        int
	Tick                         int32
	ServerFPS                    int32
	BattleDurationNanos          int64
	EffectivePlayerCount         int32
	DismissalWaitGroup           sync.WaitGroup
	Treasures                    map[int32]*Treasure
	Traps                        map[int32]*Trap
	GuardTowers                  map[int32]*GuardTower
	Bullets                      map[int32]*Bullet
	SpeedShoes                   map[int32]*SpeedShoe
	Barriers                     map[int32]*Barrier
	Pumpkins                     map[int32]*Pumpkin
	AccumulatedLocalIdForBullets int32
	CollidableWorld              *box2d.B2World
	RoomDownsyncFrameBuffer      *RingBuffer
	JoinIndexBooleanArr          []bool

	StageName                      string
	StageDiscreteW                 int32
	StageDiscreteH                 int32
	StageTileW                     int32
	StageTileH                     int32
	RawBattleStrToVec2DListMap     StrToVec2DListMap
	RawBattleStrToPolygon2DListMap StrToPolygon2DListMap
}

func (pR *Room) onTreasurePickedUp(contactingPlayer *Player, contactingTreasure *Treasure) {
	if _, existent := pR.Treasures[contactingTreasure.LocalIdInBattle]; existent {
		Logger.Info("Player has picked up treasure:", zap.Any("roomId", pR.Id), zap.Any("contactingPlayer.Id", contactingPlayer.Id), zap.Any("contactingTreasure.LocalIdInBattle", contactingTreasure.LocalIdInBattle))
		pR.CollidableWorld.DestroyBody(contactingTreasure.CollidableBody)
		pR.Treasures[contactingTreasure.LocalIdInBattle] = &Treasure{Removed: true}
		pR.Players[contactingPlayer.Id].Score += contactingTreasure.Score
	}
}

const (
	PLAYER_DEFAULT_SPEED = 200 // Hardcoded
	ADD_SPEED            = 100 // Hardcoded
)

func (pR *Room) onSpeedShoePickedUp(contactingPlayer *Player, contactingSpeedShoe *SpeedShoe, nowMillis int64) {
	if _, existent := pR.SpeedShoes[contactingSpeedShoe.LocalIdInBattle]; existent && contactingPlayer.AddSpeedAtGmtMillis == -1 {
		Logger.Info("Player has picked up a SpeedShoe:", zap.Any("roomId", pR.Id), zap.Any("contactingPlayer.Id", contactingPlayer.Id), zap.Any("contactingSpeedShoe.LocalIdInBattle", contactingSpeedShoe.LocalIdInBattle))
		pR.CollidableWorld.DestroyBody(contactingSpeedShoe.CollidableBody)
		pR.SpeedShoes[contactingSpeedShoe.LocalIdInBattle] = &SpeedShoe{
			Removed:          true,
			RemovedAtFrameId: pR.Tick,
		}
		pR.Players[contactingPlayer.Id].Speed += ADD_SPEED
		pR.Players[contactingPlayer.Id].AddSpeedAtGmtMillis = nowMillis
	}
}

func (pR *Room) onTrapPickedUp(contactingPlayer *Player, contactingTrap *Trap) {
	if _, existent := pR.Traps[contactingTrap.LocalIdInBattle]; existent {
		Logger.Info("Player has met trap:", zap.Any("roomId", pR.Id), zap.Any("contactingPlayer.Id", contactingPlayer.Id), zap.Any("contactingTrap.LocalIdInBattle", contactingTrap.LocalIdInBattle))
		pR.CollidableWorld.DestroyBody(contactingTrap.CollidableBody) // Trap is destroyed once activated.
		pR.Traps[contactingTrap.LocalIdInBattle] = &Trap{
			Removed:          true,
			RemovedAtFrameId: pR.Tick,
		}
		pR.createTrapBullet(contactingPlayer, contactingTrap)
	}
}

func (pR *Room) onBulletCrashed(contactingPlayer *Player, contactingBullet *Bullet, nowMillis int64, maxMillisToFreezePerPlayer int64) {
	if _, existent := pR.Bullets[contactingBullet.LocalIdInBattle]; existent {
		pR.CollidableWorld.DestroyBody(contactingBullet.CollidableBody)
		pR.Bullets[contactingBullet.LocalIdInBattle] = &Bullet{
			Removed:          true,
			RemovedAtFrameId: pR.Tick,
		}

		if contactingPlayer != nil {
			if maxMillisToFreezePerPlayer > (nowMillis - pR.Players[contactingPlayer.Id].FrozenAtGmtMillis) {
				// Deliberately doing nothing. -- YFLu, 2019-09-04.
			} else {
				pR.Players[contactingPlayer.Id].Speed = 0
				pR.Players[contactingPlayer.Id].FrozenAtGmtMillis = nowMillis
				pR.Players[contactingPlayer.Id].AddSpeedAtGmtMillis = -1
				//Logger.Info("Player has picked up bullet:", zap.Any("roomId", pR.Id), zap.Any("contactingPlayer.Id", contactingPlayer.Id), zap.Any("contactingBullet.LocalIdInBattle", contactingBullet.LocalIdInBattle), zap.Any("pR.Players[contactingPlayer.Id].Speed", pR.Players[contactingPlayer.Id].Speed))
			}
		}
	}
}

func (pR *Room) onPumpkinEncounterBarrier(pumpkin *Pumpkin, barrier *Barrier) {
	bvecX := pumpkin.CollidableBody.GetPosition().X - barrier.CollidableBody.GetPosition().X
	bvecY := pumpkin.CollidableBody.GetPosition().Y - barrier.CollidableBody.GetPosition().Y
	bvecLen := math.Sqrt(bvecX*bvecX + bvecY*bvecY)
	directionVec1 := &Direction{bvecX / bvecLen, bvecY / bvecLen}

	var pvecLen float64 = 1000 * 1000
	directionVec2 := &Direction{0, 0}
	for _, player := range pR.Players {
		pvecX := player.CollidableBody.GetPosition().X - pumpkin.CollidableBody.GetPosition().X
		pvecY := player.CollidableBody.GetPosition().Y - pumpkin.CollidableBody.GetPosition().Y
		l := math.Sqrt(pvecX*pvecX + pvecY*pvecY)
		if pvecLen > l {
			pvecLen = l
			directionVec2.Dx = pvecX / l
			directionVec2.Dy = pvecY / l
		}
	}
	factor := 0.5
	directionVec := &Direction{directionVec1.Dx + directionVec2.Dx*factor, directionVec2.Dy + directionVec2.Dy*factor}
	pumpkin.Dir = directionVec
}

func (pR *Room) onPumpkinEncounterPlayer(pumpkin *Pumpkin, player *Player) {
	Logger.Info("pumpkin has caught the player: ", zap.Any("pumpkinId", pumpkin.LocalIdInBattle), zap.Any("playerId", player.Id))
}

func (pR *Room) updateScore() {
	pR.Score = calRoomScore(pR.EffectivePlayerCount, pR.Capacity, pR.State)
}

func (pR *Room) AddPlayerIfPossible(pPlayer *Player) bool {
	if RoomBattleStateIns.IDLE != pR.State && RoomBattleStateIns.WAITING != pR.State {
		Logger.Warn("AddPlayerIfPossible error, roomState:", zap.Any("playerId", pPlayer.Id), zap.Any("roomId", pR.Id), zap.Any("roomState", pR.State), zap.Any("roomEffectivePlayerCount", pR.EffectivePlayerCount))
		return false
	}
	if _, existent := pR.Players[pPlayer.Id]; existent {
		Logger.Warn("AddPlayerIfPossible error, existing in the room.PlayersDict:", zap.Any("playerId", pPlayer.Id), zap.Any("roomId", pR.Id), zap.Any("roomState", pR.State), zap.Any("roomEffectivePlayerCount", pR.EffectivePlayerCount))
		return false
	}

	defer pR.onPlayerAdded(pPlayer.Id)
	pR.Players[pPlayer.Id] = pPlayer
	// Always instantiates a new channel and let the old one die out due to not being retained by any root reference.
	pR.PlayerDownsyncChanDict[pPlayer.Id] = make(chan string, (MAGIC_REMOVED_AT_FRAME_ID_PERMANENT_REMOVAL_MARGIN << 2) /* Hardcoded temporarily. */)

	pPlayer.BattleState = PlayerBattleStateIns.ADDED_PENDING_BATTLE_COLLIDER_ACK
	pPlayer.FrozenAtGmtMillis = -1       // Hardcoded temporarily.
	pPlayer.Speed = PLAYER_DEFAULT_SPEED // Hardcoded temporarily.
	pPlayer.AddSpeedAtGmtMillis = -1     // Hardcoded temporarily.
	return true
}

func (pR *Room) ReAddPlayerIfPossible(pTmpPlayerInstance *Player) bool {
	if RoomBattleStateIns.PREPARE != pR.State && RoomBattleStateIns.WAITING != pR.State && RoomBattleStateIns.IN_BATTLE != pR.State && RoomBattleStateIns.IN_SETTLEMENT != pR.State && RoomBattleStateIns.IN_DISMISSAL != pR.State {
		Logger.Warn("ReAddPlayerIfPossible error due to roomState:", zap.Any("playerId", pTmpPlayerInstance.Id), zap.Any("roomId", pR.Id), zap.Any("roomState", pR.State), zap.Any("roomEffectivePlayerCount", pR.EffectivePlayerCount))
		return false
	}
	if _, existent := pR.Players[pTmpPlayerInstance.Id]; !existent {
		Logger.Warn("ReAddPlayerIfPossible error due to player nonexistent for room:", zap.Any("playerId", pTmpPlayerInstance.Id), zap.Any("roomId", pR.Id), zap.Any("roomState", pR.State), zap.Any("roomEffectivePlayerCount", pR.EffectivePlayerCount))
		return false
	}
	/*
	 * WARNING: The "pTmpPlayerInstance *Player" used here is a temporarily constructed
	 * instance from "<proj-root>/battle_srv/ws/serve.go", which is NOT the same
	 * as "pR.Players[pTmpPlayerInstance.Id]".
	 * -- YFLu
	 */
	defer pR.onPlayerReAdded(pTmpPlayerInstance.Id)
	pEffectiveInRoomPlayerInstance := pR.Players[pTmpPlayerInstance.Id]
	pEffectiveInRoomPlayerInstance.AckingFrameId = 0

	pEffectiveInRoomPlayerInstance.BattleState = PlayerBattleStateIns.READDED_PENDING_BATTLE_COLLIDER_ACK

	Logger.Warn("ReAddPlayerIfPossible finished.", zap.Any("playerId", pTmpPlayerInstance.Id), zap.Any("roomId", pR.Id), zap.Any("roomState", pR.State), zap.Any("roomEffectivePlayerCount", pR.EffectivePlayerCount), zap.Any("player AckingFrameId", pEffectiveInRoomPlayerInstance.AckingFrameId))
	return true
}

func (pR *Room) createTrapBulletByPos(startPos Vec2D, endPos Vec2D) *Bullet {
	pR.AccumulatedLocalIdForBullets++

	var bdDef box2d.B2BodyDef
	colliderOffset := box2d.MakeB2Vec2(0, 0) // Matching that of client-side setting.
	bdDef = box2d.MakeB2BodyDef()
	bdDef.Type = box2d.B2BodyType.B2_dynamicBody
	bdDef.Position.Set(startPos.X+colliderOffset.X, startPos.Y+colliderOffset.Y)

	b2Body := pR.CollidableWorld.CreateBody(&bdDef)

	b2CircleShape := box2d.MakeB2CircleShape()
	b2CircleShape.M_radius = 32 // Matching that of client-side setting.

	fd := box2d.MakeB2FixtureDef()
	fd.Shape = &b2CircleShape
	fd.Filter.CategoryBits = COLLISION_CATEGORY_TRAP_BULLET
	fd.Filter.MaskBits = COLLISION_MASK_FOR_TRAP_BULLET
	fd.Density = 0.0
	b2Body.CreateFixtureFromDef(&fd)

	diffVecX := (endPos.X - startPos.X)
	diffVecY := (endPos.Y - startPos.Y)
	tempMag := math.Sqrt(diffVecX*diffVecX + diffVecY*diffVecY)
	linearUnitVector := Direction{
		Dx: diffVecX / tempMag,
		Dy: diffVecY / tempMag,
	}

	bullet := &Bullet{
		LocalIdInBattle: pR.AccumulatedLocalIdForBullets,
		LinearSpeed:     0.0000004, // Per nanosecond
		X:               startPos.X,
		Y:               startPos.Y,
		StartAtPoint:    &startPos,
		EndAtPoint:      &endPos,
		Dir:             &linearUnitVector,
	}

	bullet.CollidableBody = b2Body
	b2Body.SetUserData(bullet)

	pR.Bullets[bullet.LocalIdInBattle] = bullet
	return bullet
}

func (pR *Room) createTrapBullet(pPlayer *Player, pTrap *Trap) *Bullet {
	startPos := Vec2D{
		X: pTrap.CollidableBody.GetPosition().X,
		Y: pTrap.CollidableBody.GetPosition().Y,
	}
	endPos := Vec2D{
		X: pPlayer.CollidableBody.GetPosition().X,
		Y: pPlayer.CollidableBody.GetPosition().Y,
	}
	return pR.createTrapBulletByPos(startPos, endPos)
}

func (pR *Room) refreshColliders() {
	/*
	  "BarrierCollider"s are NOT added to the "colliders in B2World of the current battle", thus NOT involved in server-side collision detection!

	  -- YFLu, 2019-09-04
	*/
	gravity := box2d.MakeB2Vec2(0.0, 0.0)
	world := box2d.MakeB2World(gravity)
	world.SetContactFilter(&box2d.B2ContactFilter{})
	pR.CollidableWorld = &world

	Logger.Info("Begins `refreshColliders` for players:", zap.Any("roomId", pR.Id))
	for _, player := range pR.Players {
		var bdDef box2d.B2BodyDef
		colliderOffset := box2d.MakeB2Vec2(0, 0) // Matching that of client-side setting.
		bdDef = box2d.MakeB2BodyDef()
		bdDef.Type = box2d.B2BodyType.B2_dynamicBody
		bdDef.Position.Set(player.X+colliderOffset.X, player.Y+colliderOffset.Y)

		b2Body := pR.CollidableWorld.CreateBody(&bdDef)

		b2CircleShape := box2d.MakeB2CircleShape()
		b2CircleShape.M_radius = 32 // Matching that of client-side setting.

		fd := box2d.MakeB2FixtureDef()
		fd.Shape = &b2CircleShape
		fd.Filter.CategoryBits = COLLISION_CATEGORY_CONTROLLED_PLAYER
		fd.Filter.MaskBits = COLLISION_MASK_FOR_CONTROLLED_PLAYER
		fd.Density = 0.0
		b2Body.CreateFixtureFromDef(&fd)

		player.CollidableBody = b2Body
		b2Body.SetUserData(player)
	}
	Logger.Info("Ends `refreshColliders` for players:", zap.Any("roomId", pR.Id))

	Logger.Info("Begins `refreshColliders` for treasures:", zap.Any("roomId", pR.Id))
	for _, treasure := range pR.Treasures {
		var bdDef box2d.B2BodyDef
		bdDef.Type = box2d.B2BodyType.B2_dynamicBody
		bdDef = box2d.MakeB2BodyDef()
		bdDef.Position.Set(treasure.PickupBoundary.Anchor.X, treasure.PickupBoundary.Anchor.Y)

		b2Body := pR.CollidableWorld.CreateBody(&bdDef)

		pointsCount := len(treasure.PickupBoundary.Points)

		b2Vertices := make([]box2d.B2Vec2, pointsCount)
		for vIndex, v2 := range treasure.PickupBoundary.Points {
			b2Vertices[vIndex] = v2.ToB2Vec2()
		}

		b2PolygonShape := box2d.MakeB2PolygonShape()
		b2PolygonShape.Set(b2Vertices, pointsCount)

		fd := box2d.MakeB2FixtureDef()
		fd.Shape = &b2PolygonShape
		fd.Filter.CategoryBits = COLLISION_CATEGORY_TREASURE
		fd.Filter.MaskBits = COLLISION_MASK_FOR_TREASURE
		fd.Density = 0.0
		b2Body.CreateFixtureFromDef(&fd)

		treasure.CollidableBody = b2Body
		b2Body.SetUserData(treasure)
	}
	Logger.Info("Ends `refreshColliders` for treasures:", zap.Any("roomId", pR.Id))

	Logger.Info("Begins `refreshColliders` for towers:", zap.Any("roomId", pR.Id))
	for _, tower := range pR.GuardTowers {
		// Logger.Info("Begins `refreshColliders` for single tower:", zap.Any("k-th", k), zap.Any("tower.LocalIdInBattle", tower.LocalIdInBattle), zap.Any("tower.X", tower.X), zap.Any("tower.Y", tower.Y), zap.Any("tower.PickupBoundary", tower.PickupBoundary), zap.Any("tower.PickupBoundary.Points", tower.PickupBoundary.Points), zap.Any("tower.WidthInB2World", tower.WidthInB2World), zap.Any("tower.HeightInB2World", tower.HeightInB2World), zap.Any("roomId", pR.Id))
		var bdDef box2d.B2BodyDef
		bdDef.Type = box2d.B2BodyType.B2_dynamicBody
		bdDef = box2d.MakeB2BodyDef()
		bdDef.Position.Set(tower.PickupBoundary.Anchor.X, tower.PickupBoundary.Anchor.Y)

		b2Body := pR.CollidableWorld.CreateBody(&bdDef)
		// Logger.Info("Checks#1 `refreshColliders` for single tower:", zap.Any("k-th", k), zap.Any("tower", tower), zap.Any("roomId", pR.Id))

		pointsCount := len(tower.PickupBoundary.Points)

		b2Vertices := make([]box2d.B2Vec2, pointsCount)
		for vIndex, v2 := range tower.PickupBoundary.Points {
			b2Vertices[vIndex] = v2.ToB2Vec2()
		}
		// Logger.Info("Checks#2 `refreshColliders` for single tower:", zap.Any("k-th", k), zap.Any("tower", tower), zap.Any("roomId", pR.Id))

		b2PolygonShape := box2d.MakeB2PolygonShape()
		// Logger.Info("Checks#3 `refreshColliders` for single tower:", zap.Any("k-th", k), zap.Any("tower", tower), zap.Any("roomId", pR.Id))
		b2PolygonShape.Set(b2Vertices, pointsCount)
		// Logger.Info("Checks#4 `refreshColliders` for single tower:", zap.Any("k-th", k), zap.Any("tower", tower), zap.Any("roomId", pR.Id))

		fd := box2d.MakeB2FixtureDef()
		fd.Shape = &b2PolygonShape
		fd.Filter.CategoryBits = COLLISION_CATEGORY_TRAP
		fd.Filter.MaskBits = COLLISION_MASK_FOR_TRAP
		fd.Density = 0.0
		b2Body.CreateFixtureFromDef(&fd)
		// Logger.Info("Checks#5 `refreshColliders` for single tower:", zap.Any("k-th", k), zap.Any("tower", tower), zap.Any("roomId", pR.Id))

		tower.CollidableBody = b2Body
		b2Body.SetUserData(tower)
		// Logger.Info("Ends `refreshColliders` for single tower:", zap.Any("k-th", k), zap.Any("tower", tower), zap.Any("roomId", pR.Id))
	}
	Logger.Info("Ends `refreshColliders` for towers:", zap.Any("roomId", pR.Id))

	listener := RoomBattleContactListener{
		name: "TreasureHunterX",
		room: pR,
	}
	/*
	 * Setting a "ContactListener" for "pR.CollidableWorld"
	 * will only trigger corresponding callbacks in the
	 * SAME GOROUTINE of "pR.CollidableWorld.Step(...)" according
	 * to "https://github.com/ByteArena/box2d/blob/master/DynamicsB2World.go" and
	 * "https://github.com/ByteArena/box2d/blob/master/DynamicsB2Contact.go".
	 *
	 * The invocation-chain involves "Step -> SolveTOI -> B2ContactUpdate -> [BeginContact, EndContact, PreSolve]".
	 */
	pR.CollidableWorld.SetContactListener(listener)
}

func calculateDiffFrame(currentFrame *pb.RoomDownsyncFrame, lastFrame *pb.RoomDownsyncFrame) *pb.RoomDownsyncFrame {
	if lastFrame == nil {
		return currentFrame
	}
	diffFrame := &pb.RoomDownsyncFrame{
		Id:             currentFrame.Id,
		RefFrameId:     lastFrame.Id,
		Players:        currentFrame.Players,
		SentAt:         currentFrame.SentAt,
		CountdownNanos: currentFrame.CountdownNanos,
		Bullets:        currentFrame.Bullets,
		Treasures:      make(map[int32]*pb.Treasure, 0),
		Traps:          make(map[int32]*pb.Trap, 0),
		SpeedShoes:     make(map[int32]*pb.SpeedShoe, 0),
		GuardTowers:    make(map[int32]*pb.GuardTower, 0),
	}

	for k, last := range lastFrame.Treasures {
		if last.Removed {
			diffFrame.Treasures[k] = last
			continue
		}
		curr, ok := currentFrame.Treasures[k]
		if !ok {
			diffFrame.Treasures[k] = &pb.Treasure{Removed: true}
			Logger.Info("A treasure is removed.", zap.Any("diffFrame.id", diffFrame.Id), zap.Any("treasure.LocalIdInBattle", curr.LocalIdInBattle))
			continue
		}
		if ok, v := diffTreasure(last, curr); ok {
			diffFrame.Treasures[k] = v
		}
	}

	for k, last := range lastFrame.Bullets {
		curr, ok := currentFrame.Bullets[k]
		/*
		 * The use of 'bullet.RemovedAtFrameId' implies that you SHOULDN'T create a record '&Bullet{Removed: true}' here after it's already deleted from 'room.Bullets'. Same applies for `Traps` and `SpeedShoes`.
		 *
		 * -- YFLu
		 */
		if false == ok {
			diffFrame.Bullets[k] = &pb.Bullet{Removed: true}
			// Logger.Info("A bullet is removed.", zap.Any("diffFrame.id", diffFrame.Id), zap.Any("bullet.LocalIdInBattle", lastFrame.Bullets[k].LocalIdInBattle))
			continue
		}
		if ok, v := diffBullet(last, curr); ok {
			diffFrame.Bullets[k] = v
		}
	}

	for k, last := range lastFrame.Traps {
		curr, ok := currentFrame.Traps[k]
		if false == ok {
			continue
		}
		if ok, v := diffTrap(last, curr); ok {
			diffFrame.Traps[k] = v
		}
	}

	for k, last := range lastFrame.SpeedShoes {
		curr, ok := currentFrame.SpeedShoes[k]
		if false == ok {
			continue
		}
		if ok, v := diffSpeedShoe(last, curr); ok {
			diffFrame.SpeedShoes[k] = v
		}
	}

	return diffFrame
}

func diffTreasure(last *pb.Treasure, curr *pb.Treasure) (bool, *pb.Treasure) {
	treature := &pb.Treasure{}
	t := false
	if last.Score != curr.Score {
		treature.Score = curr.Score
		t = true
	}
	if last.X != curr.X {
		treature.X = curr.X
		t = true
	}
	if last.Y != curr.Y {
		treature.Y = curr.Y
		t = true
	}
	return t, treature
}

func diffTrap(last *pb.Trap, curr *pb.Trap) (bool, *pb.Trap) {
	trap := &pb.Trap{}
	t := false
	if last.X != curr.X {
		trap.X = curr.X
		t = true
	}
	if last.Y != curr.Y {
		trap.Y = curr.Y
		t = true
	}
	return t, trap
}

func diffSpeedShoe(last *pb.SpeedShoe, curr *pb.SpeedShoe) (bool, *pb.SpeedShoe) {
	speedShoe := &pb.SpeedShoe{}
	t := false
	if last.X != curr.X {
		speedShoe.X = curr.X
		t = true
	}
	if last.Y != curr.Y {
		speedShoe.Y = curr.Y
		t = true
	}
	return t, speedShoe
}

func diffBullet(last *pb.Bullet, curr *pb.Bullet) (bool, *pb.Bullet) {
	t := true
	return t, curr
}

func (pR *Room) ChooseStage() error {
	/*
	 * We use the verb "refresh" here to imply that upon invocation of this function, all colliders will be recovered if they were destroyed in the previous battle.
	 *
	 * -- YFLu, 2019-09-04
	 */
	pwd, err := os.Getwd()
	ErrFatal(err)

	rand.Seed(time.Now().Unix())
	stageNameList := []string{"pacman"/*, "richsoil"*/}
	chosenStageIndex := rand.Int() % len(stageNameList) // Hardcoded temporarily. -- YFLu

	pR.StageName = stageNameList[chosenStageIndex]

	relativePathForAllStages := "../frontend/assets/resources/map"
	relativePathForChosenStage := fmt.Sprintf("%s/%s", relativePathForAllStages, pR.StageName)

	pTmxMapIns := &TmxMap{}

	absDirPathContainingDirectlyTmxFile := filepath.Join(pwd, relativePathForChosenStage)
	absTmxFilePath := fmt.Sprintf("%s/map.tmx", absDirPathContainingDirectlyTmxFile)
	if !filepath.IsAbs(absTmxFilePath) {
		panic("Tmx filepath must be absolute!")
	}

	byteArr, err := ioutil.ReadFile(absTmxFilePath)
	if nil != err {
		panic(err)
	}
	err = xml.Unmarshal(byteArr, pTmxMapIns)
	if nil != err {
		panic(err)
	}

	// Obtain the content of `gidBoundariesMapInB2World`.
	gidBoundariesMapInB2World := make(map[int]StrToPolygon2DListMap, 0)
	for _, tileset := range pTmxMapIns.Tilesets {
		relativeTsxFilePath := fmt.Sprintf("%s/%s", filepath.Join(pwd, relativePathForChosenStage), tileset.Source) // Note that "TmxTileset.Source" can be a string of "relative path".
		absTsxFilePath, err := filepath.Abs(relativeTsxFilePath)
		if nil != err {
			panic(err)
		}
		if !filepath.IsAbs(absTsxFilePath) {
			panic("Filepath must be absolute!")
		}

		byteArrOfTsxFile, err := ioutil.ReadFile(absTsxFilePath)
		if nil != err {
			panic(err)
		}

		DeserializeTsxToColliderDict(pTmxMapIns, byteArrOfTsxFile, int(tileset.FirstGid), gidBoundariesMapInB2World)
	}

	stageDiscreteW, stageDiscreteH, stageTileW, stageTileH, toRetStrToVec2DListMap, toRetStrToPolygon2DListMap, err := ParseTmxLayersAndGroups(pTmxMapIns, gidBoundariesMapInB2World)
	if nil != err {
		panic(err)
	}

	pR.StageDiscreteW = stageDiscreteW
	pR.StageDiscreteH = stageDiscreteH
	pR.StageTileW = stageTileW
	pR.StageTileH = stageTileH
	pR.RawBattleStrToVec2DListMap = toRetStrToVec2DListMap
	pR.RawBattleStrToPolygon2DListMap = toRetStrToPolygon2DListMap

	// Refresh "Treasure" data for RoomDownsyncFrame.
	lowScoreTreasurePolygon2DList := *(toRetStrToPolygon2DListMap["LowScoreTreasure"])
	highScoreTreasurePolygon2DList := *(toRetStrToPolygon2DListMap["HighScoreTreasure"])

	var treasureLocalIdInBattle int32 = 0
	for _, polygon2D := range lowScoreTreasurePolygon2DList {
		/*
		   // For debug-printing only.

		   Logger.Info("ChooseStage printing polygon2D for lowScoreTreasurePolygon2DList", zap.Any("treasureLocalIdInBattle", treasureLocalIdInBattle), zap.Any("polygon2D.Anchor", polygon2D.Anchor), zap.Any("polygon2D.Points", polygon2D.Points))
		*/

		theTreasure := &Treasure{
			Id:              0,
			LocalIdInBattle: treasureLocalIdInBattle,
			Score:           LOW_SCORE_TREASURE_SCORE,
			Type:            LOW_SCORE_TREASURE_TYPE,
			X:               polygon2D.Anchor.X,
			Y:               polygon2D.Anchor.Y,
			PickupBoundary:  polygon2D,
		}

		pR.Treasures[theTreasure.LocalIdInBattle] = theTreasure
		treasureLocalIdInBattle++
	}

	for _, polygon2D := range highScoreTreasurePolygon2DList {
		/*
		   // For debug-printing only.

		   Logger.Info("ChooseStage printing polygon2D for highScoreTreasurePolygon2DList", zap.Any("treasureLocalIdInBattle", treasureLocalIdInBattle), zap.Any("polygon2D.Anchor", polygon2D.Anchor), zap.Any("polygon2D.Points", polygon2D.Points))
		*/
		theTreasure := &Treasure{
			Id:              0,
			LocalIdInBattle: treasureLocalIdInBattle,
			Score:           HIGH_SCORE_TREASURE_SCORE,
			Type:            HIGH_SCORE_TREASURE_TYPE,
			X:               polygon2D.Anchor.X,
			Y:               polygon2D.Anchor.Y,
			PickupBoundary:  polygon2D,
		}

		pR.Treasures[theTreasure.LocalIdInBattle] = theTreasure

		treasureLocalIdInBattle++
	}

	// Refresh "GuardTower" data for RoomDownsyncFrame.
	guardTowerPolygon2DList := *(toRetStrToPolygon2DListMap["GuardTower"])
	var guardTowerLocalIdInBattle int32 = 0
	for _, polygon2D := range guardTowerPolygon2DList {
		/*
		   // For debug-printing only.

		   Logger.Info("ChooseStage printing polygon2D for guardTowerPolygon2DList", zap.Any("guardTowerLocalIdInBattle", guardTowerLocalIdInBattle), zap.Any("polygon2D.Anchor", polygon2D.Anchor), zap.Any("polygon2D.Points", polygon2D.Points), zap.Any("pR.GuardTowers", pR.GuardTowers))
		*/

		var inRangePlayers InRangePlayerCollection
		pInRangePlayers := &inRangePlayers
		pInRangePlayers = pInRangePlayers.Init(10)
		theGuardTower := &GuardTower{
			Id:              0,
			LocalIdInBattle: guardTowerLocalIdInBattle,
			X:               polygon2D.Anchor.X,
			Y:               polygon2D.Anchor.Y,
			PickupBoundary:  polygon2D,
			InRangePlayers:  pInRangePlayers,
			LastAttackTick:  utils.UnixtimeNano(),
			WidthInB2World:  float64(polygon2D.TmxObjectWidth),
			HeightInB2World: float64(polygon2D.TmxObjectHeight),
		}

		pR.GuardTowers[theGuardTower.LocalIdInBattle] = theGuardTower

		guardTowerLocalIdInBattle++
	}

	return nil
}

func (pR *Room) StartBattle() {
	if RoomBattleStateIns.WAITING != pR.State {
		return
	}

	// Always instantiates a new channel and let the old one die out due to not being retained by any root reference.
	pR.CmdFromPlayersChan = make(chan interface{}, (MAGIC_REMOVED_AT_FRAME_ID_PERMANENT_REMOVAL_MARGIN << 2) /* Hardcoded temporarily. Note that a `GolangChannel` whose size is too large would induce "large RAM use of the overall process" and thus cause frequent websocket disconnection in this game. */)
	nanosPerFrame := 1000000000 / int64(pR.ServerFPS)
	secondsPerFrame := float64(1) / float64(pR.ServerFPS)
	velocityIterationsPerFrame := 0
	positionIterationsPerFrame := 0
	pR.Tick = 0
	maxMillisToFreezePerPlayer := int64(5000)   // Hardcoded temporarily.
	maxMillisToAddSpeedPerPlayer := int64(3000) // Hardcoded temporarily.

	// Refresh "Colliders" for server-side contact listening of B2World.
	pR.refreshColliders()

	/**
	 * Will be triggered from a goroutine which executes the critical `Room.AddPlayerIfPossible`, thus the `battleMainLoop` should be detached.
	 * All of the consecutive stages, e.g. settlement, dismissal, should share the same goroutine with `battleMainLoop`.
	 */
	battleMainLoop := func() {
		defer func() {
			Logger.Info("The `battleMainLoop` is stopped for:", zap.Any("roomId", pR.Id))
			pR.onBattleStoppedForSettlement()
		}()
		battleMainLoopStartedNanos := utils.UnixtimeNano()
		var totalElapsedNanos int64 //离游戏开始的时间
		totalElapsedNanos = 0

		GUARD_TOWER_ATTACK_INTERVAL_NANOS := int64(4 * 1000 * 1000 * 1000) // 守护塔攻击频率4秒

		BULLET_MAX_DIST := 600.0 //移动600个像素点距离后消失

		Logger.Info("The `battleMainLoop` is started for:", zap.Any("roomId", pR.Id))
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

			currentFrame := &pb.RoomDownsyncFrame{
				Id:             pR.Tick,
				RefFrameId:     0, // Hardcoded for now.
				Players:        toPbPlayers(pR.Players),
				Treasures:      toPbTreasures(pR.Treasures),
				Traps:          toPbTraps(pR.Traps),
				Bullets:        toPbBullets(pR.Bullets),
				SpeedShoes:     toPbSpeedShoes(pR.SpeedShoes),
				GuardTowers:    toPbGuardTowers(pR.GuardTowers),
				SentAt:         utils.UnixtimeMilli(),
				CountdownNanos: (pR.BattleDurationNanos - totalElapsedNanos),
			}

			minAckingFrameId := int32(999999999) // Hardcoded as a max reference.
			for _, player := range pR.Players {
				if player.AckingFrameId > minAckingFrameId {
					continue
				}
				minAckingFrameId = player.AckingFrameId
			}

			for localIdInBattle, bullet := range pR.Bullets {
				if !bullet.Removed {
					continue
				}
				if bullet.RemovedAtFrameId > minAckingFrameId-MAGIC_REMOVED_AT_FRAME_ID_PERMANENT_REMOVAL_MARGIN {
					// The bullet removal information is NOT YET acknowledged by some players.
					continue
				}
				// Logger.Info("Permanently removing one of pR.Bullets which was previously marked as removed", zap.Any("minAckingFrameId", minAckingFrameId), zap.Any("bullet.LocalIdInBattle", localIdInBattle), zap.Any("bullet.RemovedAtFrameId", bullet.RemovedAtFrameId), zap.Any("currentFrameId", currentFrame.Id))
				delete(pR.Bullets, localIdInBattle)
			}

			/*
			 * TODO: It might be necessary to use extra BinaryTrees for maintaining the updates to
			 * "*.Removed" and "*.RemovedAtFrameId", to reduce TimeComplexity.
			 *
			 * MOTIVATION FOR SUCH TODO: Entities like `pR.Players` and `pR.Bullets` deserve full collection traversal at each frame. However
			 * `pR.Treasures` and `pR.Traps` could be very large in the initial size and merely removed very slowly, thus not worth the full
			 * traversal at each frame.
			 *
			 * Here I have deliberately avoided applying the use of "Treasure.RemovedAtFrameId" as a demonstration.
			 */
			for localIdInBattle, trap := range pR.Traps {
				if !trap.Removed {
					continue
				}
				if trap.RemovedAtFrameId > minAckingFrameId-MAGIC_REMOVED_AT_FRAME_ID_PERMANENT_REMOVAL_MARGIN {
					// The trap removal information is NOT YET acknowledged by some players.
					continue
				}
				delete(pR.Traps, localIdInBattle)
			}

			for localIdInBattle, speedShoe := range pR.SpeedShoes {
				if !speedShoe.Removed {
					continue
				}
				if speedShoe.RemovedAtFrameId > minAckingFrameId-MAGIC_REMOVED_AT_FRAME_ID_PERMANENT_REMOVAL_MARGIN {
					// The trap removal information is NOT YET acknowledged by some players.
					continue
				}
				delete(pR.SpeedShoes, localIdInBattle)
			}

			for playerId, player := range pR.Players {
				/*
				 * WARNING: Please note that the "marshalling of `assembledFrame`" is deliberately put within the `battleMainLoop(1 goroutine per room)` to avoid thread-safety issues, i.e. NOT AFTER extracting an `assembledFrame` from each `DedicatedForwardingChanForPlayer` in `forwardingLoopAgainstBoundRoom(another 1 goroutine per room, used in "<proj-root>/battle_srv/ws/serve.go")` for preventing simultaneous access to `pR.(Treasures | Traps | Bullets | SpeedShoes)` etc. from two different goroutines.
				 */

				/*
				 * TODO
				 *
				 * DON'T send any DiffFrame into "DedicatedForwardingChanForPlayer" if the player is disconnected, because it could jam the channel and cause significant delay upon "battle recovery for reconnected player".
				 */
				if PlayerBattleStateIns.ACTIVE != player.BattleState {
					continue
				} else {
					theForwardingChannel := pR.PlayerDownsyncChanDict[playerId]
					/*
						          if 0 == player.AckingFrameId {
												Logger.Info("Player could be resyncing:", zap.Any("currentFrameId", currentFrame.Id), zap.Any("roomId", pR.Id), zap.Any("playerId", playerId))
						          }
					*/
					lastFrame := pR.RoomDownsyncFrameBuffer.Get(player.AckingFrameId)
					diffFrame := calculateDiffFrame(currentFrame, lastFrame)

					// Logger.Info("Sending RoomDownsyncFrame in battleMainLoop:", zap.Any("RoomDownsyncFrame", assembledFrame), zap.Any("roomId", pR.Id), zap.Any("playerId", playerId))

					/*
					   An instance of `RoomDownsyncFrame` contains lots of pointers which will be accessed(R/W) by both `Room.battleMainLoop` and `Room.cmdReceivingLoop`, e.g. involving `Room.Players: map[int32]*Player`, of each room.

					   Therefore any `assembledFrame: RoomDownsyncFrame` should be pre-marshalled as `toForwardMsg := proto.Marshal(assembledFrame)` before being sent via each `theForwardingChannel (per player*room)`, to avoid thread-safety issues due to further access to `RoomDownsyncFrame.AnyField` AFTER it's retrieved from the "exit" of the channel.
					*/
					theBytes, marshalErr := proto.Marshal(diffFrame)
					if nil != marshalErr {
						Logger.Error("Error marshalling RoomDownsyncFrame in battleMainLoop:", zap.Any("the error", marshalErr), zap.Any("roomId", pR.Id), zap.Any("playerId", playerId))
						continue
					}
					theStr := string(theBytes)
					utils.SendStrSafely(theStr, theForwardingChannel)
				}
			}
			pR.RoomDownsyncFrameBuffer.Put(currentFrame)
			collisionNowMillis := utils.UnixtimeMilli()

			// Collision detection & resolution. Reference https://github.com/genxium/GoCollision2DPrac/tree/master/by_box2d.
			for _, player := range pR.Players {
				if -1 == player.AddSpeedAtGmtMillis {
					// TODO: Removed the magic number `-1`.
					continue
				}
				if maxMillisToAddSpeedPerPlayer > (collisionNowMillis - player.AddSpeedAtGmtMillis) {
					continue
				}
				player.AddSpeedAtGmtMillis = -1
				if player.Speed == PLAYER_DEFAULT_SPEED+ADD_SPEED {
					player.Speed = PLAYER_DEFAULT_SPEED // Hardcoded temporarily.
				}
			}

			// Collision detection & resolution. Reference https://github.com/genxium/GoCollision2DPrac/tree/master/by_box2d.
			for _, player := range pR.Players {
				/**
				 * WARNING Statements within this loop MUST be called by the same OSThread/L(ight)W(eight)P(rocess) to ensure that the "WorldLockAssertion" doesn't fail.
				 */
				newB2Vec2Pos := box2d.MakeB2Vec2(player.X, player.Y)
				MoveDynamicBody(player.CollidableBody, &newB2Vec2Pos, 0)

				if -1 == player.FrozenAtGmtMillis {
					// TODO: Remove the magic number `-1`.
					continue
				}
				if maxMillisToFreezePerPlayer > (collisionNowMillis - player.FrozenAtGmtMillis) {
					continue
				}
				player.Speed = PLAYER_DEFAULT_SPEED // Hardcoded temporarily.
				player.FrozenAtGmtMillis = -1
			}

			bulletElapsedTime := nanosPerFrame  // TODO: Remove this hardcoded constant.
			for _, bullet := range pR.Bullets { //子弹飞行
				if bullet.Removed {
					continue
				}
				elapsedMag := bullet.LinearSpeed * float64(bulletElapsedTime)
				newB2Vec2Pos := box2d.MakeB2Vec2(bullet.X+float64(elapsedMag)*bullet.Dir.Dx, bullet.Y+float64(elapsedMag)*bullet.Dir.Dy)
				MoveDynamicBody(bullet.CollidableBody, &newB2Vec2Pos, 0)
				bullet.X = newB2Vec2Pos.X
				bullet.Y = newB2Vec2Pos.Y

				// 如果超出最大飞行距离, 标记消失
				if BULLET_MAX_DIST < Distance(bullet.StartAtPoint, &Vec2D{
					X: bullet.X,
					Y: bullet.Y,
				}) {
					pR.onBulletCrashed(nil, bullet, 0, 0)
				}
			}

			pR.CollidableWorld.Step(secondsPerFrame, velocityIterationsPerFrame, positionIterationsPerFrame)

			// 对于所有GuardTower, 如果攻击列表不为空, 判断是否发射子弹
			for _, tower := range pR.GuardTowers {
				if 1 > tower.InRangePlayers.CurrentSize {
					continue
				}
				now := utils.UnixtimeNano()

				/*
				 * 顺序攻击
				 */
				if (now - tower.LastAttackTick) > GUARD_TOWER_ATTACK_INTERVAL_NANOS {
					tower.LastAttackTick = now

					playerNode := tower.InRangePlayers.NextPlayerToAttack()
					towerHeight := float64(tower.HeightInB2World)
					startPos := Vec2D{
						X: tower.CollidableBody.GetPosition().X,
						Y: tower.CollidableBody.GetPosition().Y + 0.5*towerHeight,
					}
					endPos := Vec2D{
						X: playerNode.player.CollidableBody.GetPosition().X,
						Y: playerNode.player.CollidableBody.GetPosition().Y,
					}
					pR.createTrapBulletByPos(startPos, endPos)

				}
			}

			for _, player := range pR.Players {
				// 如果玩家碰到以下物品, 触发对应的回调
				for edge := player.CollidableBody.GetContactList(); edge != nil; edge = edge.Next {
					if edge.Contact.IsTouching() {
						switch v := edge.Other.GetUserData().(type) {
						case *Treasure:
							pR.onTreasurePickedUp(player, v)
						case *Trap:
							pR.onTrapPickedUp(player, v)
						case *Bullet:
							pR.onBulletCrashed(player, v, collisionNowMillis, maxMillisToFreezePerPlayer)
						case *SpeedShoe:
							pR.onSpeedShoePickedUp(player, v, collisionNowMillis)
						default:
							// Logger.Warn("player Collision ", zap.Any("playerId", player.Id), zap.Any("collision", v))
						}
					}
				}
			}

			now := utils.UnixtimeNano()
			elapsedInCalculation := now - stCalculation //计算过程中损失的时间, 用于计算睡眠时间
			totalElapsedNanos = (now - battleMainLoopStartedNanos)
			// Logger.Info("Elapsed time statistics:", zap.Any("roomId", pR.Id), zap.Any("elapsedInCalculation", elapsedInCalculation), zap.Any("totalElapsedNanos", totalElapsedNanos))
			time.Sleep(time.Duration(nanosPerFrame - elapsedInCalculation))
		}
	}

	cmdReceivingLoop := func() {
		defer func() {
			if r := recover(); r != nil {
				Logger.Warn("Room cmdReceivingLoop, recovery spot#1, recovered from: ", zap.Any("roomId", pR.Id), zap.Any("panic", r))
			}
			Logger.Info("The `cmdReceivingLoop` is stopped for:", zap.Any("roomId", pR.Id))
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
				if _, existent := pR.Players[immediatePlayerData.Id]; !existent {
					break
				}
				pEffectiveInRoomPlayerInstance := pR.Players[immediatePlayerData.Id]
				if pEffectiveInRoomPlayerInstance.BattleState == PlayerBattleStateIns.DISCONNECTED || pEffectiveInRoomPlayerInstance.BattleState == PlayerBattleStateIns.LOST {
					break
				}
				// Logger.Info("Room received `immediatePlayerData`:", zap.Any("immediatePlayerData", immediatePlayerData), zap.Any("roomId", pR.Id))
				pEffectiveInRoomPlayerInstance.AckingFrameId = immediatePlayerData.AckingFrameId

				// Update immediate player info for broadcasting or unicasting.
				pEffectiveInRoomPlayerInstance.Dir.Dx = immediatePlayerData.Dir.Dx
				pEffectiveInRoomPlayerInstance.Dir.Dy = immediatePlayerData.Dir.Dy

				if 0 >= pEffectiveInRoomPlayerInstance.Speed {
					break
				}
				pEffectiveInRoomPlayerInstance.X = immediatePlayerData.X
				pEffectiveInRoomPlayerInstance.Y = immediatePlayerData.Y
			default:
			}
			// elapsedInCalculation := utils.UnixtimeNano() - stCalculation
		}
	}
	pR.onBattlePrepare(func() {
		pR.onBattleStarted() // NOTE: Deliberately not using `defer`.
		go cmdReceivingLoop()
		go battleMainLoop()
	})
}

func (pR *Room) StopBattleForSettlement() {
	if RoomBattleStateIns.IN_BATTLE != pR.State {
		return
	}
	pR.State = RoomBattleStateIns.STOPPING_BATTLE_FOR_SETTLEMENT
	Logger.Info("Stopping the `battleMainLoop` for:", zap.Any("roomId", pR.Id))
	pR.Tick++
	for playerId, _ := range pR.Players {
		assembledFrame := &pb.RoomDownsyncFrame{
			Id:             pR.Tick,
			RefFrameId:     0, // Hardcoded for now.
			Players:        toPbPlayers(pR.Players),
			SentAt:         utils.UnixtimeMilli(),
			CountdownNanos: -1, // TODO: Replace this magic constant!
			Treasures:      toPbTreasures(pR.Treasures),
			Traps:          toPbTraps(pR.Traps),
		}
		theForwardingChannel := pR.PlayerDownsyncChanDict[playerId]
		theBytes, marshalErr := proto.Marshal(assembledFrame)
		if nil != marshalErr {
			Logger.Error("Error marshalling RoomDownsyncFrame in battleMainLoop:", zap.Any("the error", marshalErr), zap.Any("roomId", pR.Id), zap.Any("playerId", playerId))
			continue
		}
		theStr := string(theBytes)
		utils.SendStrSafely(theStr, theForwardingChannel)
	}
	// Note that `pR.onBattleStoppedForSettlement` will be called by `battleMainLoop`.
}

func (pR *Room) onBattleStarted() {
	if RoomBattleStateIns.PREPARE != pR.State {
		return
	}
	pR.State = RoomBattleStateIns.IN_BATTLE
	Logger.Info("The `battleMainLoop` is started for:", zap.Any("roomId", pR.Id))
	pR.updateScore()
}

type battleStartCbType func()

func (pR *Room) onBattlePrepare(cb battleStartCbType) {
	if RoomBattleStateIns.WAITING != pR.State {
		return
	}
	pR.State = RoomBattleStateIns.PREPARE
	Logger.Info("Battle state transitted to RoomBattleStateIns.PREPARE for:", zap.Any("roomId", pR.Id))

	playerMetas := make(map[int32]*pb.PlayerMeta, 0)
	for _, player := range pR.Players {
		playerMetas[player.Id] = &pb.PlayerMeta{
			Id:          player.Id,
			Name:        player.Name,
			DisplayName: player.DisplayName,
			Avatar:      player.Avatar,
			JoinIndex:   player.JoinIndex,
		}
	}

	battleReadyToStartFrame := &pb.RoomDownsyncFrame{
		Id:          pR.Tick,
		Players:     toPbPlayers(pR.Players),
		SentAt:      utils.UnixtimeMilli(),
		RefFrameId:  MAGIC_ROOM_DOWNSYNC_FRAME_ID_BATTLE_READY_TO_START,
		PlayerMetas: playerMetas,
	}

	theBytes, marshalErr := proto.Marshal(battleReadyToStartFrame)
	if nil != marshalErr {
		Logger.Error("Error marshalling battleReadyToStartFrame in onBattlePrepare:", zap.Any("the error", marshalErr))
	}
	Logger.Info("Before broadcasting playerAddedFrame:", zap.Any("playerMetas", playerMetas))
	Logger.Info("Sending out frame for RoomBattleState.PREPARE ", zap.Any("theBytes", theBytes))
	theStr := string(theBytes)
	for _, player := range pR.Players {
		theForwardingChannel := pR.PlayerDownsyncChanDict[player.Id]
		utils.SendStrSafely(theStr, theForwardingChannel)
	}

	battlePreparationNanos := int64(6000000000)
	preparationLoop := func() {
		defer func() {
			Logger.Info("The `preparationLoop` is stopped for:", zap.Any("roomId", pR.Id))
			cb()
		}()
		preparationLoopStartedNanos := utils.UnixtimeNano()
		var totalElapsedNanos int64
		totalElapsedNanos = 0
		for {
			if totalElapsedNanos > battlePreparationNanos {
				break
			}
			now := utils.UnixtimeNano()
			totalElapsedNanos = (now - preparationLoopStartedNanos)
			time.Sleep(time.Duration(battlePreparationNanos - totalElapsedNanos))
		}
	}
	go preparationLoop()
}

func (pR *Room) onBattleStoppedForSettlement() {
	if RoomBattleStateIns.STOPPING_BATTLE_FOR_SETTLEMENT != pR.State {
		return
	}
	defer func() {
		pR.onSettlementCompleted()
	}()
	pR.State = RoomBattleStateIns.IN_SETTLEMENT
	Logger.Info("The room is in settlement:", zap.Any("roomId", pR.Id))
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
	if 0 < len(pR.Players) {
		Logger.Info("The room is in dismissal:", zap.Any("roomId", pR.Id))
		for playerId, _ := range pR.Players {
			Logger.Info("Adding 1 to pR.DismissalWaitGroup:", zap.Any("roomId", pR.Id), zap.Any("playerId", playerId))
			pR.DismissalWaitGroup.Add(1)
			pR.expelPlayerForDismissal(playerId)
			pR.DismissalWaitGroup.Done()
			Logger.Info("Decremented 1 to pR.DismissalWaitGroup:", zap.Any("roomId", pR.Id), zap.Any("playerId", playerId))
		}
		pR.DismissalWaitGroup.Wait()
	}
	pR.onDismissed()
}

func (pR *Room) onDismissed() {

	// Always instantiates new HeapRAM blocks and let the old blocks die out due to not being retained by any root reference.
	pR.Players = make(map[int32]*Player)
	pR.Treasures = make(map[int32]*Treasure)
	pR.Traps = make(map[int32]*Trap)
	pR.GuardTowers = make(map[int32]*GuardTower)
	pR.Bullets = make(map[int32]*Bullet)
	pR.SpeedShoes = make(map[int32]*SpeedShoe)
	pR.PlayerDownsyncChanDict = make(map[int32]chan string)
	for indice, _ := range pR.JoinIndexBooleanArr {
		pR.JoinIndexBooleanArr[indice] = false
	}
	pR.CmdFromPlayersChan = nil
	pR.RoomDownsyncFrameBuffer = NewRingBuffer(512)

	pR.ChooseStage()
	pR.EffectivePlayerCount = 0

	// [WARNING] It's deliberately ordered such that "pR.State = RoomBattleStateIns.IDLE" is put AFTER all the refreshing operations above.
	pR.State = RoomBattleStateIns.IDLE
	pR.updateScore()

	Logger.Info("The room is completely dismissed:", zap.Any("roomId", pR.Id))
}

func (pR *Room) Unicast(toPlayerId int32, msg interface{}) {
	// TODO
}

func (pR *Room) Broadcast(msg interface{}) {
	// TODO
}

func (pR *Room) expelPlayerDuringGame(playerId int32) {
	defer pR.onPlayerExpelledDuringGame(playerId)
}

func (pR *Room) expelPlayerForDismissal(playerId int32) {
	pR.onPlayerExpelledForDismissal(playerId)
}

func (pR *Room) onPlayerExpelledDuringGame(playerId int32) {
	pR.onPlayerLost(playerId)
}

func (pR *Room) onPlayerExpelledForDismissal(playerId int32) {
	pR.onPlayerLost(playerId)

	Logger.Info("onPlayerExpelledForDismissal:", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("nowRoomBattleState", pR.State), zap.Any("nowRoomEffectivePlayerCount", pR.EffectivePlayerCount))
}

func (pR *Room) OnPlayerDisconnected(playerId int32) {
	defer func() {
		if r := recover(); r != nil {
			Logger.Error("Room OnPlayerDisconnected, recovery spot#1, recovered from: ", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("panic", r))
		}
	}()

	if _, existent := pR.Players[playerId]; existent {
    switch (pR.Players[playerId].BattleState) {
    case PlayerBattleStateIns.DISCONNECTED:
    case PlayerBattleStateIns.LOST:
    case PlayerBattleStateIns.EXPELLED_DURING_GAME:
    case PlayerBattleStateIns.EXPELLED_IN_DISMISSAL:
      Logger.Info("Room OnPlayerDisconnected[early return #1]:", zap.Any("playerId", playerId), zap.Any("playerBattleState", pR.Players[playerId].BattleState), zap.Any("roomId", pR.Id), zap.Any("nowRoomBattleState", pR.State), zap.Any("nowRoomEffectivePlayerCount", pR.EffectivePlayerCount))
      return
    }
  } else {
    // Not even the "pR.Players[playerId]" exists.
    Logger.Info("Room OnPlayerDisconnected[early return #2]:", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("nowRoomBattleState", pR.State), zap.Any("nowRoomEffectivePlayerCount", pR.EffectivePlayerCount))
    return
  }

	switch pR.State {
	case RoomBattleStateIns.WAITING:
		pR.onPlayerLost(playerId)
		delete(pR.Players, playerId) // Note that this statement MUST be put AFTER `pR.onPlayerLost(...)` to avoid nil pointer exception.
		if 0 == pR.EffectivePlayerCount {
			pR.State = RoomBattleStateIns.IDLE
		}
		pR.updateScore()
		Logger.Info("Player disconnected while room is at RoomBattleStateIns.WAITING:", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("nowRoomBattleState", pR.State), zap.Any("nowRoomEffectivePlayerCount", pR.EffectivePlayerCount))
	default:
    pR.Players[playerId].BattleState = PlayerBattleStateIns.DISCONNECTED
    /**
     * Note that there's no need to close `pR.PlayerDownsyncChanDict[playerId]` immediately.
     */
    Logger.Info("Player is just disconnected from room:", zap.Any("playerId", playerId), zap.Any("playerBattleState", pR.Players[playerId].BattleState), zap.Any("roomId", pR.Id), zap.Any("nowRoomBattleState", pR.State), zap.Any("nowRoomEffectivePlayerCount", pR.EffectivePlayerCount))
	}
}

func (pR *Room) onPlayerLost(playerId int32) {
	defer func() {
		if r := recover(); r != nil {
			Logger.Error("Room OnPlayerLost, recovery spot, recovered from: ", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("panic", r))
		}
	}()
	if player, existent := pR.Players[playerId]; existent {
		player.BattleState = PlayerBattleStateIns.LOST
		if _, chanExistent := pR.PlayerDownsyncChanDict[playerId]; chanExistent {
      Logger.Info("onPlayerLost, sending termination symbol for:", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id))
      utils.SendStrSafely("", pR.PlayerDownsyncChanDict[playerId])
			utils.CloseStrChanSafely(pR.PlayerDownsyncChanDict[playerId])
			delete(pR.PlayerDownsyncChanDict, playerId)
		}
		pR.EffectivePlayerCount--
		indiceInJoinIndexBooleanArr := int(player.JoinIndex - 1)
		if (0 <= indiceInJoinIndexBooleanArr) && (indiceInJoinIndexBooleanArr < len(pR.JoinIndexBooleanArr)) {
			pR.JoinIndexBooleanArr[indiceInJoinIndexBooleanArr] = false
		} else {
			Logger.Warn("Room OnPlayerLost, pR.JoinIndexBooleanArr is out of range: ", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("indiceInJoinIndexBooleanArr", indiceInJoinIndexBooleanArr), zap.Any("len(pR.JoinIndexBooleanArr)", len(pR.JoinIndexBooleanArr)))
		}
		player.JoinIndex = MAGIC_JOIN_INDEX_INVALID
		Logger.Info("Room OnPlayerLost: ", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("resulted pR.JoinIndexBooleanArr", pR.JoinIndexBooleanArr))
	}
}

func (pR *Room) onPlayerAdded(playerId int32) {
	pR.EffectivePlayerCount++
	if 1 == pR.EffectivePlayerCount {
		pR.State = RoomBattleStateIns.WAITING
		/**
		 * TODO: Choose a map randomly, parse it and cache it to be send "down" to the participants.
		 *
		 * -- YFLu, 2019-08-29
		 */
		go func(pR *Room) {
			<-time.After(time.Duration(Conf.BotServer.SecondsBeforeSummoning) * time.Second)
			botServerEndpoint := fmt.Sprintf("%s://%s:%d/spawnBot?expectedRoomId=%d&symmetricKey=%s", Conf.BotServer.Protocol, Conf.BotServer.Host, Conf.BotServer.Port, pR.Id, Conf.BotServer.SymmetricKey)
			if pR.State != RoomBattleStateIns.WAITING {
				return
			}
			botServerResp, botServerRespErr := http.Get(botServerEndpoint)
			if nil != botServerRespErr {
				Logger.Warn("Request to the BotServer has got an error:", zap.Any("botServerResp", botServerResp), zap.Any("botServerRespErr", botServerRespErr))
			}
			if nil != botServerResp && nil != botServerResp.Body {
				defer botServerResp.Body.Close()
			}
		}(pR)
	}

	for index, value := range pR.JoinIndexBooleanArr {
		if false == value {
			pR.Players[playerId].JoinIndex = int32(index) + 1
			pR.JoinIndexBooleanArr[index] = true

			// Lazily assign the initial position of "Player" for "RoomDownsyncFrame".
			playerPosList := *(pR.RawBattleStrToVec2DListMap["PlayerStartingPos"])
			if index > len(playerPosList) {
				Logger.Warn("onPlayerAdded error, index >= len(playerPosList):", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("roomState", pR.State), zap.Any("roomEffectivePlayerCount", pR.EffectivePlayerCount))
				panic("onPlayerAdded error")
			}
			playerPos := playerPosList[index]

			if nil == playerPos {
				Logger.Warn("onPlayerAdded error, nil == playerPos:", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("roomState", pR.State), zap.Any("roomEffectivePlayerCount", pR.EffectivePlayerCount))
				panic("onPlayerAdded error")
			}
			pR.Players[playerId].X = playerPos.X
			pR.Players[playerId].Y = playerPos.Y

			break
		}
	}

	pR.updateScore()
	Logger.Info("onPlayerAdded:", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("joinIndex", pR.Players[playerId].JoinIndex), zap.Any("EffectivePlayerCount", pR.EffectivePlayerCount), zap.Any("resulted pR.JoinIndexBooleanArr", pR.JoinIndexBooleanArr), zap.Any("RoomBattleState", pR.State))
}

func (pR *Room) onPlayerReAdded(playerId int32) {
	/*
	 * [WARNING]
	 *
	 * If a player quits at "RoomBattleState.WAITING", then his/her re-joining will always invoke `AddPlayerIfPossible(...)`. Therefore, this
	 * function will only be invoked for players who quit the battle at ">RoomBattleState.WAITING" and re-join at "RoomBattleState.IN_BATTLE", during which the `pR.JoinIndexBooleanArr` doesn't change.
	 */
	Logger.Info("Room got `onPlayerReAdded` invoked,", zap.Any("roomId", pR.Id), zap.Any("playerId", playerId), zap.Any("resulted pR.JoinIndexBooleanArr", pR.JoinIndexBooleanArr))

	pR.updateScore()
}

func (pR *Room) OnPlayerBattleColliderAcked(playerId int32) bool {
	pPlayer, ok := pR.Players[playerId]
	if false == ok {
		return false
	}

	playerMetas := make(map[int32]*pb.PlayerMeta, 0)
	for _, player := range pR.Players {
		playerMetas[player.Id] = &pb.PlayerMeta{
			Id:          player.Id,
			Name:        player.Name,
			DisplayName: player.DisplayName,
			Avatar:      player.Avatar,
			JoinIndex:   player.JoinIndex,
		}
	}

	var playerAckedFrame *pb.RoomDownsyncFrame

	switch pPlayer.BattleState {
	case PlayerBattleStateIns.ADDED_PENDING_BATTLE_COLLIDER_ACK:
		playerAckedFrame = &pb.RoomDownsyncFrame{
			Id:          pR.Tick,
			Players:     toPbPlayers(pR.Players),
			SentAt:      utils.UnixtimeMilli(),
			RefFrameId:  MAGIC_ROOM_DOWNSYNC_FRAME_ID_PLAYER_ADDED_AND_ACKED,
			PlayerMetas: playerMetas,
		}
	case PlayerBattleStateIns.READDED_PENDING_BATTLE_COLLIDER_ACK:
		playerAckedFrame = &pb.RoomDownsyncFrame{
			Id:          pR.Tick,
			Players:     toPbPlayers(pR.Players),
			SentAt:      utils.UnixtimeMilli(),
			RefFrameId:  MAGIC_ROOM_DOWNSYNC_FRAME_ID_PLAYER_READDED_AND_ACKED,
			PlayerMetas: playerMetas,
		}
	default:
	}

	theBytes, marshalErr := proto.Marshal(playerAckedFrame)
	if nil != marshalErr {
		Logger.Error("Error marshalling playerAckedFrame in `OnPlayerBattleColliderAcked`:", zap.Any("the error", marshalErr))
	}
	theStr := string(theBytes)

	for _, player := range pR.Players {
		theForwardingChannel := pR.PlayerDownsyncChanDict[player.Id]
		/*
		   [WARNING]

		   This `playerAckedFrame` is the first ever "RoomDownsyncFrame" for every "PersistentSessionClient on the frontend", and it goes right after each "BattleColliderInfo".

		   By making use of the sequential nature of each `theForwardingChannel`, all later "RoomDownsyncFrame"s generated after `pRoom.StartBattle()` will be put behind this `playerAckedFrame`.

		   -- YFLu, 2019-09-05
		*/
		utils.SendStrSafely(theStr, theForwardingChannel)
	}

	pPlayer.BattleState = PlayerBattleStateIns.ACTIVE
	Logger.Info("OnPlayerBattleColliderAcked", zap.Any("roomId", pR.Id), zap.Any("playerId", playerId))

	if pR.Capacity == len(pR.Players) {
		allAcked := true
		for _, p := range pR.Players {
			if PlayerBattleStateIns.ACTIVE != p.BattleState {
				allAcked = false
				break
			}
		}
		if true == allAcked {
			pR.StartBattle() // WON'T run if the battle state is not in WAITING.
		}
	}

	pR.updateScore()
	return true
}

type RoomBattleContactListener struct {
	name string
	room *Room
}

// Implementing the GolangBox2d contact listeners [begins].
/**
 * Note that the execution of these listeners is within the SAME GOROUTINE as that of "`battleMainLoop` in the same room".
 * See the comments in `Room.refreshContactListener()` for details.
 */
func (l RoomBattleContactListener) BeginContact(contact box2d.B2ContactInterface) {
	var pTower *GuardTower
	var pPlayer *Player

	switch v := contact.GetNodeA().Other.GetUserData().(type) {
	case *GuardTower:
		pTower = v
	case *Player:
		pPlayer = v
	default:
		//
	}

	switch v := contact.GetNodeB().Other.GetUserData().(type) {
	case *GuardTower:
		pTower = v
	case *Player:
		pPlayer = v
	default:
	}

	if pTower != nil && pPlayer != nil {
		pTower.InRangePlayers.AppendPlayer(pPlayer)
	}
}

func (l RoomBattleContactListener) EndContact(contact box2d.B2ContactInterface) {
	var pTower *GuardTower
	var pPlayer *Player

	switch v := contact.GetNodeA().Other.GetUserData().(type) {
	case *GuardTower:
		pTower = v
	case *Player:
		pPlayer = v
	default:
	}

	switch v := contact.GetNodeB().Other.GetUserData().(type) {
	case *GuardTower:
		pTower = v
	case *Player:
		pPlayer = v
	default:
	}

	if pTower != nil && pPlayer != nil {
		pTower.InRangePlayers.RemovePlayerById(pPlayer.Id)
	}
}

func (l RoomBattleContactListener) PreSolve(contact box2d.B2ContactInterface, oldManifold box2d.B2Manifold) {
	//fmt.Printf("I am PreSolve %s\n", l.name);
}

func (l RoomBattleContactListener) PostSolve(contact box2d.B2ContactInterface, impulse *box2d.B2ContactImpulse) {
	//fmt.Printf("PostSolve %s\n", l.name);
}

// Implementing the GolangBox2d contact listeners [ends].
