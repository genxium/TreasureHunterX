package models

import (
	"fmt"
	"github.com/ByteArena/box2d"
	"github.com/golang/protobuf/proto"
	"go.uber.org/zap"
	"io/ioutil"
	"math"
	"os"
	"path/filepath"
	. "server/common"
	"server/common/utils"
	"sync"
	"time"
)

const (
	MAGIC_REMOVED_AT_FRAME_ID_PERMANENT_REMOVAL_MARGIN = 5
)

const (
	// You can equivalently use the `GroupIndex` approach, but the more complicated and general purpose approach is used deliberately here. Reference http://www.aurelienribon.com/post/2011-07-box2d-tutorial-collision-filtering.
	COLLISION_CATEGORY_CONTROLLED_PLAYER = (1 << 1)
	COLLISION_CATEGORY_TREASURE          = (1 << 2)
	COLLISION_CATEGORY_TRAP              = (1 << 3)
	COLLISION_CATEGORY_TRAP_BULLET       = (1 << 4)

	COLLISION_MASK_FOR_CONTROLLED_PLAYER = (COLLISION_CATEGORY_TREASURE | COLLISION_CATEGORY_TRAP | COLLISION_CATEGORY_TRAP_BULLET)
	COLLISION_MASK_FOR_TREASURE          = (COLLISION_CATEGORY_CONTROLLED_PLAYER)
	COLLISION_MASK_FOR_TRAP              = (COLLISION_CATEGORY_CONTROLLED_PLAYER)
	COLLISION_MASK_FOR_TRAP_BULLET       = (COLLISION_CATEGORY_CONTROLLED_PLAYER)
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
		PREPARE:                        -2,
		IN_BATTLE:                      10000000,
		STOPPING_BATTLE_FOR_SETTLEMENT: 10000001,
		IN_SETTLEMENT:                  10000002,
		IN_DISMISSAL:                   10000003,
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
	Bullets                      map[int32]*Bullet
	AccumulatedLocalIdForBullets int32
	CollidableWorld              *box2d.B2World
	RoomDownsyncFrameBuffer      *RingBuffer
	JoinIndexBooleanArr          []bool
}

type RoomDownsyncFrame struct {
	/* TODO
	An instance of `RoomDownsyncFrame` contains lots of pointers which will be accessed(R/W) by both `Room.battleMainLoop` and `Room.cmdReceivingLoop`, e.g. involving `Room.Players: map[int32]*Player`, of each room.

	Therefore any `assembledFrame: RoomDownsyncFrame` should be pre-marshal as `toForwardMsg := proto.Marshal(assembledFrame)` before being sent via each `theForwardingChannel (per player*room)`, to avoid thread-safety issues due to further access to `RoomDownsyncFrame.AnyField` AFTER it's retrieved from the "exit" of the channel.
	*/
	Id             int32               `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	RefFrameId     int32               `protobuf:"varint,2,opt,name=refFrameId,proto3" json:"refFrameId,omitempty"`
	Players        map[int32]*Player   `protobuf:"bytes,3,rep,name=players,proto3" json:"players,omitempty" protobuf_key:"varint,1,opt,name=key,proto3" protobuf_val:"bytes,2,opt,name=value,proto3"`
	SentAt         int64               `protobuf:"varint,4,opt,name=sendAt,proto3" json:"sendAt,omitempty"`
	CountdownNanos int64               `protobuf:"varint,5,opt,name=countdownNanos,proto3" json:"countdownNanos,omitempty"`
	Treasures      map[int32]*Treasure `protobuf:"bytes,6,rep,name=treasures,proto3" json:"treasures,omitempty" protobuf_key:"varint,1,opt,name=key,proto3" protobuf_val:"bytes,2,opt,name=value,proto3"`
	Traps          map[int32]*Trap     `protobuf:"bytes,7,rep,name=traps,proto3" json:"traps,omitempty" protobuf_key:"varint,1,opt,name=key,proto3" protobuf_val:"bytes,2,opt,name=value,proto3"`
	Bullets        map[int32]*Bullet   `protobuf:"bytes,8,rep,name=bullets,proto3" json:"bullets,omitempty" protobuf_key:"varint,1,opt,name=key,proto3" protobuf_val:"bytes,2,opt,name=value,proto3"`
}

func (m *RoomDownsyncFrame) Reset()         { *m = RoomDownsyncFrame{} }
func (m *RoomDownsyncFrame) String() string { return proto.CompactTextString(m) }
func (m *RoomDownsyncFrame) ProtoMessage()  {}

func (pR *Room) onTreasurePickedUp(contactingPlayer *Player, contactingTreasure *Treasure) {
	if _, existent := pR.Treasures[contactingTreasure.LocalIdInBattle]; existent {
		Logger.Info("Player has picked up treasure:", zap.Any("roomId", pR.Id), zap.Any("contactingPlayer.Id", contactingPlayer.Id), zap.Any("contactingTreasure.LocalIdInBattle", contactingTreasure.LocalIdInBattle))
		pR.CollidableWorld.DestroyBody(contactingTreasure.CollidableBody)
		pR.Treasures[contactingTreasure.LocalIdInBattle] = &Treasure{Removed: true}
		pR.Players[contactingPlayer.Id].Score += contactingTreasure.Score
	}
}

func (pR *Room) onTrapPickedUp(contactingPlayer *Player, contactingTrap *Trap) {
	if _, existent := pR.Traps[contactingTrap.LocalIdInBattle]; existent {
		Logger.Info("Player has met trap:", zap.Any("roomId", pR.Id), zap.Any("contactingPlayer.Id", contactingPlayer.Id), zap.Any("contactingTrap.LocalIdInBattle", contactingTrap.LocalIdInBattle))
		pR.CollidableWorld.DestroyBody(contactingTrap.CollidableBody)
		pR.Traps[contactingTrap.LocalIdInBattle] = &Trap{
			Removed:          true,
			RemovedAtFrameId: pR.Tick,
		}
		pR.createTrapBullet(contactingPlayer, contactingTrap)
	}
}

func (pR *Room) onBulletCrashed(contactingPlayer *Player, contactingBullet *Bullet, nowMillis int64) {
	if _, existent := pR.Bullets[contactingBullet.LocalIdInBattle]; existent {
		pR.CollidableWorld.DestroyBody(contactingBullet.CollidableBody)
		pR.Bullets[contactingBullet.LocalIdInBattle] = &Bullet{
			Removed:          true,
			RemovedAtFrameId: pR.Tick,
		}
		// TODO: Resume speed of this player later in `battleMainLoop` w.r.t. `Player.FrozenAtGmtMillis`, instead of a delicate timer to prevent thread-safety issues.
		pR.Players[contactingPlayer.Id].Speed = 0
		pR.Players[contactingPlayer.Id].FrozenAtGmtMillis = nowMillis
		Logger.Info("Player has picked up bullet:", zap.Any("roomId", pR.Id), zap.Any("contactingPlayer.Id", contactingPlayer.Id), zap.Any("contactingBullet.LocalIdInBattle", contactingBullet.LocalIdInBattle), zap.Any("pR.Players[contactingPlayer.Id].Speed", pR.Players[contactingPlayer.Id].Speed))
	}
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
	pR.PlayerDownsyncChanDict[pPlayer.Id] = make(chan string, 1024 /* Hardcoded temporarily. */)
	pPlayer.BattleState = PlayerBattleStateIns.ACTIVE
	pPlayer.FrozenAtGmtMillis = -1 // Hardcoded temporarily.
	pPlayer.Speed = 300            // Hardcoded temporarily.
	return true
}

func (pR *Room) ReAddPlayerIfPossible(pPlayer *Player) bool {
	if RoomBattleStateIns.PREPARE != pR.State && RoomBattleStateIns.WAITING != pR.State && RoomBattleStateIns.IN_BATTLE != pR.State && RoomBattleStateIns.IN_SETTLEMENT != pR.State {
		Logger.Warn("ReAddPlayerIfPossible error, roomState:", zap.Any("playerId", pPlayer.Id), zap.Any("roomId", pR.Id), zap.Any("roomState", pR.State), zap.Any("roomEffectivePlayerCount", pR.EffectivePlayerCount))
		return false
	}
	if _, existent := pR.Players[pPlayer.Id]; !existent {
		Logger.Warn("ReAddPlayerIfPossible error, nonexistent:", zap.Any("playerId", pPlayer.Id), zap.Any("roomId", pR.Id), zap.Any("roomState", pR.State), zap.Any("roomEffectivePlayerCount", pR.EffectivePlayerCount))
		return false
	}
	defer pR.onPlayerReAdded(pPlayer.Id)
	pPlayer.BattleState = PlayerBattleStateIns.ACTIVE
	// Note: All previous position and orientation info should just be recovered.
	return true
}

func (pR *Room) createTrap(pAnchor *Vec2D, trapLocalIdInBattle int32, pTsxIns *Tsx) *Trap {

	polyLine := pTsxIns.TrapPolyLineList[0]

	thePoints := make([]*Vec2D, len(polyLine.Points))
	for index, value := range polyLine.Points {
		thePoints[index] = &Vec2D{
			X: value.X,
			Y: value.Y,
		}
	}

	thePolygon := Polygon2D{
		Anchor: pAnchor,
		Points: thePoints,
	}

	theTrap := Trap{
		Id:              0,
		LocalIdInBattle: trapLocalIdInBattle,
		X:               pAnchor.X,
		Y:               pAnchor.Y,
		PickupBoundary:  &thePolygon,
	}

	return &theTrap
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
	fd.Filter.CategoryBits = COLLISION_CATEGORY_TRAP
	fd.Filter.MaskBits = COLLISION_MASK_FOR_TRAP
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
		LinearSpeed:     0.0000004,
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

func (pR *Room) createTreasure(pAnchor *Vec2D, treasureLocalIdInBattle int32, pTsxIns *Tsx) *Treasure {

	polyLine := pTsxIns.TreasurePolyLineList[0]

	thePoints := make([]*Vec2D, len(polyLine.Points))
	for index, value := range polyLine.Points {
		thePoints[index] = &Vec2D{
			X: value.X,
			Y: value.Y,
		}
	}

	thePolygon := Polygon2D{
		Anchor: pAnchor,
		Points: thePoints,
	}

	theTreasure := Treasure{
		Id:              0,
		LocalIdInBattle: treasureLocalIdInBattle,
		Score:           0,
		Type:            0,
		X:               pAnchor.X,
		Y:               pAnchor.Y,
		PickupBoundary:  &thePolygon,
	}

	return &theTreasure
}

func (pR *Room) InitTraps(pTmxMapIns *TmxMap, pTsxIns *Tsx) {
	for key, value := range pTmxMapIns.TrapsInitPosList {
		{
			pAnchor := &Vec2D{
				X: float64(value.X),
				Y: float64(value.Y),
			}
			theTrap := pR.createTrap(pAnchor, int32(key), pTsxIns)
			pR.Traps[theTrap.LocalIdInBattle] = theTrap
		}
	}
	Logger.Info("InitTraps finished:", zap.Any("roomId", pR.Id), zap.Any("traps", pR.Traps))
}

func (pR *Room) InitTreasures(pTmxMapIns *TmxMap, pTsxIns *Tsx) {
	for key, value := range pTmxMapIns.TreasuresInfo {
		{
			pAnchor := &Vec2D{
				X: float64(value.InitPos.X),
				Y: float64(value.InitPos.Y),
			}
			theTreasure := pR.createTreasure(pAnchor, int32(key), pTsxIns)
			theTreasure.Score = value.Score
			theTreasure.Type = value.Type
			pR.Treasures[theTreasure.LocalIdInBattle] = theTreasure
		}
	}
	for key, value := range pTmxMapIns.HighTreasuresInfo {
		{
			pAnchor := &Vec2D{
				X: float64(value.InitPos.X),
				Y: float64(value.InitPos.Y),
			}
			theTreasure := pR.createTreasure(pAnchor, int32(key), pTsxIns)
			theTreasure.Score = value.Score
			theTreasure.Type = value.Type
			pR.Treasures[theTreasure.LocalIdInBattle] = theTreasure
		}
	}
	Logger.Info("InitTreasures finished:", zap.Any("roomId", pR.Id), zap.Any("treasures", pR.Treasures))
}

func (pR *Room) InitColliders() {
	gravity := box2d.MakeB2Vec2(0.0, 0.0)
	world := box2d.MakeB2World(gravity)
	pR.CollidableWorld = &world

	// Logger.Info("InitColliders for pR.Players:", zap.Any("roomId", pR.Id))
	for _, player := range pR.Players {
		var bdDef box2d.B2BodyDef
		colliderOffset := box2d.MakeB2Vec2(0, 0) // Matching that of client-side setting.
		bdDef = box2d.MakeB2BodyDef()
		bdDef.Type = box2d.B2BodyType.B2_dynamicBody
		bdDef.Position.Set(player.X+colliderOffset.X, player.Y+colliderOffset.Y)

		b2PlayerBody := pR.CollidableWorld.CreateBody(&bdDef)

		b2CircleShape := box2d.MakeB2CircleShape()
		b2CircleShape.M_radius = 32 // Matching that of client-side setting.

		fd := box2d.MakeB2FixtureDef()
		fd.Shape = &b2CircleShape
		fd.Filter.CategoryBits = COLLISION_CATEGORY_CONTROLLED_PLAYER
		fd.Filter.MaskBits = COLLISION_MASK_FOR_CONTROLLED_PLAYER
		fd.Density = 0.0
		b2PlayerBody.CreateFixtureFromDef(&fd)

		player.CollidableBody = b2PlayerBody
		b2PlayerBody.SetUserData(player)
		// PrettyPrintBody(player.CollidableBody)
	}

	Logger.Info("InitColliders for pR.Treasures:", zap.Any("roomId", pR.Id))
	for _, treasure := range pR.Treasures {
		var bdDef box2d.B2BodyDef
		bdDef.Type = box2d.B2BodyType.B2_dynamicBody
		bdDef = box2d.MakeB2BodyDef()
		bdDef.Position.Set(treasure.PickupBoundary.Anchor.X, treasure.PickupBoundary.Anchor.Y)

		b2TreasureBody := pR.CollidableWorld.CreateBody(&bdDef)

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
		b2TreasureBody.CreateFixtureFromDef(&fd)

		treasure.CollidableBody = b2TreasureBody
		b2TreasureBody.SetUserData(treasure)
		// PrettyPrintBody(treasure.CollidableBody)
	}

	Logger.Info("InitColliders for pR.Traps:", zap.Any("roomId", pR.Id))
	for _, trap := range pR.Traps {
		var bdDef box2d.B2BodyDef
		bdDef.Type = box2d.B2BodyType.B2_dynamicBody
		bdDef = box2d.MakeB2BodyDef()
		bdDef.Position.Set(trap.PickupBoundary.Anchor.X, trap.PickupBoundary.Anchor.Y)

		b2TreasureBody := pR.CollidableWorld.CreateBody(&bdDef)

		pointsCount := len(trap.PickupBoundary.Points)

		b2Vertices := make([]box2d.B2Vec2, pointsCount)
		for vIndex, v2 := range trap.PickupBoundary.Points {
			b2Vertices[vIndex] = v2.ToB2Vec2()
		}

		b2PolygonShape := box2d.MakeB2PolygonShape()
		b2PolygonShape.Set(b2Vertices, pointsCount)

		fd := box2d.MakeB2FixtureDef()
		fd.Shape = &b2PolygonShape
		fd.Filter.CategoryBits = COLLISION_CATEGORY_TRAP
		fd.Filter.MaskBits = COLLISION_MASK_FOR_TRAP
		fd.Density = 0.0
		b2TreasureBody.CreateFixtureFromDef(&fd)

		trap.CollidableBody = b2TreasureBody
		b2TreasureBody.SetUserData(trap)
		// PrettyPrintBody(trap.CollidableBody)
	}
}

func calculateDiffFrame(currentFrame, lastFrame *RoomDownsyncFrame) *RoomDownsyncFrame {
	if lastFrame == nil {
		return currentFrame
	}
	diffFrame := &RoomDownsyncFrame{
		Id:             currentFrame.Id,
		RefFrameId:     lastFrame.Id,
		Players:        currentFrame.Players,
		SentAt:         currentFrame.SentAt,
		CountdownNanos: currentFrame.CountdownNanos,
		Bullets:        currentFrame.Bullets,
		Treasures:      make(map[int32]*Treasure, 0),
		Traps:          make(map[int32]*Trap, 0),
	}

	for k, last := range lastFrame.Treasures {
		if last.Removed {
			diffFrame.Treasures[k] = last
			continue
		}
		curr, ok := currentFrame.Treasures[k]
		if !ok {
			diffFrame.Treasures[k] = &Treasure{Removed: true}
			Logger.Info("A treasure is removed.", zap.Any("diffFrame.id", diffFrame.Id), zap.Any("treasure.LocalIdInBattle", curr.LocalIdInBattle))
			continue
		}
		if ok, v := diffTreasure(last, curr); ok {
			diffFrame.Treasures[k] = v
		}
	}

	for k, last := range lastFrame.Bullets {
		curr, ok := currentFrame.Bullets[k]
		if !ok {
			diffFrame.Bullets[k] = &Bullet{Removed: true}
			Logger.Info("A bullet is removed.", zap.Any("diffFrame.id", diffFrame.Id), zap.Any("bullet.LocalIdInBattle", curr.LocalIdInBattle))
			continue
		}
		if ok, v := diffBullet(last, curr); ok {
			diffFrame.Bullets[k] = v
		}
	}

	for k, last := range lastFrame.Traps {
		if last.Removed {
			diffFrame.Traps[k] = last
			continue
		}
		curr, ok := currentFrame.Traps[k]
		if !ok {
			diffFrame.Traps[k] = &Trap{Removed: true}
			Logger.Info("A trap is removed.", zap.Any("diffFrame.id", diffFrame.Id), zap.Any("trap.LocalIdInBattle", curr.LocalIdInBattle))
			continue
		}
		if ok, v := diffTrap(last, curr); ok {
			diffFrame.Traps[k] = v
		}
	}

	return diffFrame
}

func diffTreasure(last, curr *Treasure) (bool, *Treasure) {
	treature := &Treasure{}
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

func diffTrap(last, curr *Trap) (bool, *Trap) {
	trap := &Trap{}
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

func diffBullet(last, curr *Bullet) (bool, *Bullet) {
	bullet := &Bullet{}
	t := false
	if last.X != curr.X {
		bullet.X = bullet.X
		t = true
	}
	if last.Y != curr.Y {
		bullet.Y = curr.Y
		t = true
	}
	return t, bullet
}

func (pR *Room) StartBattle() {
	if RoomBattleStateIns.WAITING != pR.State {
		return
	}

	relativePath := "../frontend/assets/resources/map/treasurehunter.tmx"
	execPath, err := os.Executable()
	ErrFatal(err)

	pwd, err := os.Getwd()
	ErrFatal(err)

	fmt.Printf("execPath = %v, pwd = %s, returning...\n", execPath, pwd)

	tmxMapIns := TmxMap{}
	pTmxMapIns := &tmxMapIns
	fp := filepath.Join(pwd, relativePath)
	fmt.Printf("fp == %v\n", fp)
	if !filepath.IsAbs(fp) {
		panic("Tmx filepath must be absolute!")
	}

	byteArr, err := ioutil.ReadFile(fp)
	ErrFatal(err)
	DeserializeToTmxMapIns(byteArr, pTmxMapIns)
	var index = 0
	for _, player := range pR.Players {
		tmp := pTmxMapIns.ControlledPlayersInitPosList[index]
		index++
		player.X = tmp.X
		player.Y = tmp.Y
		player.Score = 0
	}

	execPath, err = os.Executable()
	ErrFatal(err)

	pwd, err = os.Getwd()
	ErrFatal(err)

	fmt.Printf("execPath = %v, pwd = %s, returning...\n", execPath, pwd)

	tsxIns := Tsx{}
	pTsxIns := &tsxIns
	relativePath = "../frontend/assets/resources/map/tile_1.tsx"
	fp = filepath.Join(pwd, relativePath)
	fmt.Printf("fp == %v\n", fp)
	if !filepath.IsAbs(fp) {
		panic("Tmx filepath must be absolute!")
	}

	byteArr, err = ioutil.ReadFile(fp)
	ErrFatal(err)
	DeserializeToTsxIns(byteArr, pTsxIns)

	pR.InitTreasures(pTmxMapIns, pTsxIns)
	pR.InitTraps(pTmxMapIns, pTsxIns)
	pR.InitColliders()

	// Always instantiates a new channel and let the old one die out due to not being retained by any root reference.
	pR.CmdFromPlayersChan = make(chan interface{}, 2048 /* Hardcoded temporarily. */)
	nanosPerFrame := 1000000000 / int64(pR.ServerFPS)
	secondsPerFrame := float64(1) / float64(pR.ServerFPS)
	velocityIterationsPerFrame := 0
	positionIterationsPerFrame := 0
	pR.Tick = 0
	maxMillisToFreezePerPlayer := int64(5000) // Hardcoded temporarily.
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

			currentFrame := &RoomDownsyncFrame{
				Id:             pR.Tick,
				RefFrameId:     0, // Hardcoded for now.
				Players:        pR.Players,
				SentAt:         utils.UnixtimeMilli(),
				CountdownNanos: (pR.BattleDurationNanos - totalElapsedNanos),
				Treasures:      pR.Treasures,
				Traps:          pR.Traps,
				Bullets:        pR.Bullets,
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

			for playerId, player := range pR.Players {
				theForwardingChannel := pR.PlayerDownsyncChanDict[playerId]
				lastFrame := pR.RoomDownsyncFrameBuffer.Get(player.AckingFrameId)
				diffFrame := calculateDiffFrame(currentFrame, lastFrame)

				// Logger.Info("Sending RoomDownsyncFrame in battleMainLoop:", zap.Any("RoomDownsyncFrame", assembledFrame), zap.Any("roomId", pR.Id), zap.Any("playerId", playerId))
				theBytes, marshalErr := proto.Marshal(diffFrame)
				if marshalErr != nil {
					Logger.Error("Error marshalling RoomDownsyncFrame in battleMainLoop:", zap.Any("the error", marshalErr), zap.Any("roomId", pR.Id), zap.Any("playerId", playerId))
					continue
				}
				theStr := string(theBytes)
				utils.SendStrSafely(theStr, theForwardingChannel)
			}
			pR.RoomDownsyncFrameBuffer.Put(currentFrame)
			collisionNowMillis := utils.UnixtimeMilli()

			// Collision detection & resolution. Reference https://github.com/genxium/GoCollision2DPrac/tree/master/by_box2d.
			for _, player := range pR.Players {
				/**
				 * WARNING Statements within this loop MUST be called by the same OSThread/L(ight)W(eight)P(rocess) to ensure that the "WorldLockAssertion" doesn't fail.
				 */
				newB2Vec2Pos := box2d.MakeB2Vec2(player.X, player.Y)
				MoveDynamicBody(player.CollidableBody, &newB2Vec2Pos, 0)

				if -1 == player.FrozenAtGmtMillis {
					// TODO: Removed the magic number `-1`.
					continue
				}
				if maxMillisToFreezePerPlayer > (collisionNowMillis - player.FrozenAtGmtMillis) {
					continue
				}
				player.Speed = 300 // Hardcoded temporarily.
				// TODO: Removed the magic number `-1`.
				player.FrozenAtGmtMillis = -1
			}

			bulletElapsedTime := nanosPerFrame // TODO: Remove this hardcoded constant.
			for _, bullet := range pR.Bullets {
				if bullet.Removed {
					continue
				}
				elapsedMag := bullet.LinearSpeed * float64(bulletElapsedTime)
				newB2Vec2Pos := box2d.MakeB2Vec2(bullet.X+float64(elapsedMag)*bullet.Dir.Dx, bullet.Y+float64(elapsedMag)*bullet.Dir.Dy)
				MoveDynamicBody(bullet.CollidableBody, &newB2Vec2Pos, 0)
				bullet.X = newB2Vec2Pos.X
				bullet.Y = newB2Vec2Pos.Y
			}
			pR.CollidableWorld.Step(secondsPerFrame, velocityIterationsPerFrame, positionIterationsPerFrame)
			itContacts := pR.CollidableWorld.GetContactList()
			for itContacts != nil {
				// Logger.Info("Found an AABB contact:", zap.Any("roomId", pR.Id))
				if itContacts.IsTouching() {
					bodyA := itContacts.GetFixtureA().GetBody()
					bodyB := itContacts.GetFixtureB().GetBody()
					if contactingPlayer, validPlayer := bodyA.GetUserData().(*Player); validPlayer {
						if contactingTreasure, validTreasure := bodyB.GetUserData().(*Treasure); validTreasure {
							pR.onTreasurePickedUp(contactingPlayer, contactingTreasure)
						} else if contactingTrap, validTrap := bodyB.GetUserData().(*Trap); validTrap {
							pR.onTrapPickedUp(contactingPlayer, contactingTrap)
						} else {
							if contactingBullet, validBullet := bodyB.GetUserData().(*Bullet); validBullet {
								// Logger.Info("Found an AABB contact which is potentially a <bullet, player> pair case #1:", zap.Any("roomId", pR.Id))
								pR.onBulletCrashed(contactingPlayer, contactingBullet, collisionNowMillis)
							}
						}
					} else {
						if contactingPlayer, validPlayer := bodyB.GetUserData().(*Player); validPlayer {
							if contactingTreasure, validTreasure := bodyA.GetUserData().(*Treasure); validTreasure {
								pR.onTreasurePickedUp(contactingPlayer, contactingTreasure)
							} else if contactingTrap, validTrap := bodyA.GetUserData().(*Trap); validTrap {
								pR.onTrapPickedUp(contactingPlayer, contactingTrap)
							} else {
								if contactingBullet, validBullet := bodyA.GetUserData().(*Bullet); validBullet {
									// Logger.Info("Found an AABB contact which is potentially a <bullet, player> pair case #2:", zap.Any("roomId", pR.Id))
									pR.onBulletCrashed(contactingPlayer, contactingBullet, collisionNowMillis)
								}
							}
						}
					}
				}
				itContacts = itContacts.GetNext()
			}
			now := utils.UnixtimeNano()
			elapsedInCalculation := now - stCalculation
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
				// Logger.Info("Room received `immediatePlayerData`:", zap.Any("immediatePlayerData", immediatePlayerData), zap.Any("roomId", pR.Id))
				pR.Players[immediatePlayerData.Id].AckingFrameId = immediatePlayerData.AckingFrameId

				// Update immediate player info for broadcasting or unicasting.
				pR.Players[immediatePlayerData.Id].Dir.Dx = immediatePlayerData.Dir.Dx
				pR.Players[immediatePlayerData.Id].Dir.Dy = immediatePlayerData.Dir.Dy

				if 0 >= pR.Players[immediatePlayerData.Id].Speed {
					break
				}
				pR.Players[immediatePlayerData.Id].X = immediatePlayerData.X
				pR.Players[immediatePlayerData.Id].Y = immediatePlayerData.Y
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
		assembledFrame := &RoomDownsyncFrame{
			Id:             pR.Tick,
			RefFrameId:     0, // Hardcoded for now.
			Players:        pR.Players,
			SentAt:         utils.UnixtimeMilli(),
			CountdownNanos: -1, // TODO: Replace this magic constant!
			Treasures:      pR.Treasures,
			Traps:          pR.Traps,
			Bullets:        pR.Bullets,
		}
		theForwardingChannel := pR.PlayerDownsyncChanDict[playerId]
		theBytes, marshalErr := proto.Marshal(assembledFrame)
		if marshalErr != nil {
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
	Logger.Info("The `battleMainLoop` is prepare started for:", zap.Any("roomId", pR.Id))
	playerJoinIndexFrame := &RoomDownsyncFrame{
		Id:         pR.Tick,
		Players:    pR.Players,
		SentAt:     utils.UnixtimeMilli(),
		RefFrameId: -99, // Hardcoded for Ready to start.
	}
	theBytes, marshalErr := proto.Marshal(playerJoinIndexFrame)
	if marshalErr != nil {
		Logger.Error("Error marshalling playerJoinIndexFrame in onBattlePrepare:", zap.Any("the error", marshalErr))
	}
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
	for playerId, _ := range pR.Players {
		pR.DismissalWaitGroup.Add(1)
		pR.expelPlayerForDismissal(playerId)
	}
	Logger.Info("The room is in dismissal:", zap.Any("roomId", pR.Id))
	pR.DismissalWaitGroup.Wait()
	pR.onDismissed()
}

func (pR *Room) onDismissed() {
	Logger.Info("The room is completely dismissed:", zap.Any("roomId", pR.Id))
	pR.State = RoomBattleStateIns.IDLE
	pR.EffectivePlayerCount = 0

	// Always instantiates new HeapRAM blocks and let the old blocks die out due to not being retained by any root reference.
	pR.Players = make(map[int32]*Player)
	pR.Treasures = make(map[int32]*Treasure)
	pR.Traps = make(map[int32]*Trap)
	pR.Bullets = make(map[int32]*Bullet)
	pR.PlayerDownsyncChanDict = make(map[int32]chan string)
  for indice, _ := range(pR.JoinIndexBooleanArr) {
    pR.JoinIndexBooleanArr[indice] = false
  }
	pR.CmdFromPlayersChan = nil
	pR.updateScore()
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
	theForwardingChannel := pR.PlayerDownsyncChanDict[playerId]
	utils.SendStrSafely("", theForwardingChannel)
	pR.onPlayerLost(playerId)
	pR.DismissalWaitGroup.Done()

	Logger.Info("Player expelled for dismissal:", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("nowRoomBattleState", pR.State), zap.Any("nowRoomEffectivePlayerCount", pR.EffectivePlayerCount))
}

func (pR *Room) OnPlayerDisconnected(playerId int32) {
	defer func() {
		if r := recover(); r != nil {
			Logger.Error("Room OnPlayerDisconnected, recovery spot#1, recovered from: ", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("panic", r))
		}
	}()
	/**
	 * Note that there's no need to close `pR.PlayerDownsyncChanDict[playerId]` immediately.
	 */
	switch pR.State {
	case RoomBattleStateIns.WAITING:
		pR.onPlayerLost(playerId)
		delete(pR.Players, playerId) // Note that this statement MUST be put AFTER `pR.onPlayerLost(...)` to avoid nil pointer exception.
		if pR.EffectivePlayerCount == 0 {
			pR.State = RoomBattleStateIns.IDLE
		}
		pR.updateScore()
		Logger.Info("Player disconnected while room is at RoomBattleStateIns.WAITING:", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("nowRoomBattleState", pR.State), zap.Any("nowRoomEffectivePlayerCount", pR.EffectivePlayerCount))
		break
	default:
		if _, existent := pR.Players[playerId]; existent {
			pR.Players[playerId].BattleState = PlayerBattleStateIns.DISCONNECTED
			Logger.Info("Player is just disconnected from room:", zap.Any("playerId", playerId), zap.Any("playerBattleState", pR.Players[playerId].BattleState), zap.Any("roomId", pR.Id), zap.Any("nowRoomBattleState", pR.State), zap.Any("nowRoomEffectivePlayerCount", pR.EffectivePlayerCount))
		}
		break
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
			utils.CloseStrChanSafely(pR.PlayerDownsyncChanDict[playerId])
			delete(pR.PlayerDownsyncChanDict, playerId)
		}
		pR.EffectivePlayerCount--
		indiceInJoinIndexBooleanArr := int(player.JoinIndex - 1)
		Logger.Info("Room OnPlayerLost, about to turn one of pR.JoinIndexBooleanArr to false: ", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("indiceInJoinIndexBooleanArr", indiceInJoinIndexBooleanArr))
		if (0 <= indiceInJoinIndexBooleanArr) && (indiceInJoinIndexBooleanArr < len(pR.JoinIndexBooleanArr)) {
			pR.JoinIndexBooleanArr[indiceInJoinIndexBooleanArr] = false
		} else {
			Logger.Warn("Room OnPlayerLost, pR.JoinIndexBooleanArr is out of range: ", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("indiceInJoinIndexBooleanArr", indiceInJoinIndexBooleanArr), zap.Any("len(pR.JoinIndexBooleanArr)", len(pR.JoinIndexBooleanArr)))
		}
		player.JoinIndex = -1
	}
}

func (pR *Room) onPlayerAdded(playerId int32) {
	pR.EffectivePlayerCount++
	if 1 == pR.EffectivePlayerCount {
		pR.State = RoomBattleStateIns.WAITING
	}
  Logger.Info("onPlayerAdded", zap.Any("roomId", pR.Id), zap.Any("pR.JoinIndexBooleanArr", pR.JoinIndexBooleanArr))
	for index, value := range pR.JoinIndexBooleanArr {
		if false == value {
			pR.Players[playerId].JoinIndex = int32(index) + 1
			pR.JoinIndexBooleanArr[index] = true
			break
		}
	}
	pR.updateScore()
	playerJoinIndexFrame := &RoomDownsyncFrame{
		Id:         pR.Tick,
		Players:    pR.Players,
		SentAt:     utils.UnixtimeMilli(),
		RefFrameId: -98, // Hardcoded for messages player joinIndex.
	}

	theBytes, marshalErr := proto.Marshal(playerJoinIndexFrame)
	if marshalErr != nil {
		Logger.Error("Error marshalling playerJoinIndexFrame in onPlayerAdded:", zap.Any("the error", marshalErr))
	}
	theStr := string(theBytes)

	for _, player := range pR.Players {
		theForwardingChannel := pR.PlayerDownsyncChanDict[player.Id]
		utils.SendStrSafely(theStr, theForwardingChannel)
	}

	Logger.Info("onPlayerAdded:", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("joinIndex", pR.Players[playerId].JoinIndex), zap.Any("EffectivePlayerCount", pR.EffectivePlayerCount), zap.Any("RoomBattleState", pR.State))
	if pR.Capacity == len(pR.Players) {
		pR.StartBattle()
	}
}

func (pR *Room) onPlayerReAdded(playerId int32) {
	for index, value := range pR.JoinIndexBooleanArr {
		if false == value {
			pR.Players[playerId].JoinIndex = int32(index) + 1
			pR.JoinIndexBooleanArr[index] = true
			break
		}
	}
	Logger.Info("room JoinIndexBooleanArr", zap.Any(":", pR.JoinIndexBooleanArr))
	pR.updateScore()
}
