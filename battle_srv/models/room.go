package models

import (
	"github.com/ByteArena/box2d"
	"github.com/golang/protobuf/proto"
	"go.uber.org/zap"
	"io/ioutil"
	"math"
	"math/rand"
	"os"
	"path/filepath"
	. "server/common"
	"server/common/utils"
	"sync"
	"time"
  "net/http"
  "fmt"
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
}

type RoomDownsyncFrame struct {
	/* TODO
	An instance of `RoomDownsyncFrame` contains lots of pointers which will be accessed(R/W) by both `Room.battleMainLoop` and `Room.cmdReceivingLoop`, e.g. involving `Room.Players: map[int32]*Player`, of each room.

	Therefore any `assembledFrame: RoomDownsyncFrame` should be pre-marshal as `toForwardMsg := proto.Marshal(assembledFrame)` before being sent via each `theForwardingChannel (per player*room)`, to avoid thread-safety issues due to further access to `RoomDownsyncFrame.AnyField` AFTER it's retrieved from the "exit" of the channel.
	*/
	Id             int32                 `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	RefFrameId     int32                 `protobuf:"varint,2,opt,name=refFrameId,proto3" json:"refFrameId,omitempty"`
	Players        map[int32]*Player     `protobuf:"bytes,3,rep,name=players,proto3" json:"players,omitempty" protobuf_key:"varint,1,opt,name=key,proto3" protobuf_val:"bytes,2,opt,name=value,proto3"`
	SentAt         int64                 `protobuf:"varint,4,opt,name=sentAt,proto3" json:"sentAt,omitempty"`
	CountdownNanos int64                 `protobuf:"varint,5,opt,name=countdownNanos,proto3" json:"countdownNanos,omitempty"`
	Treasures      map[int32]*Treasure   `protobuf:"bytes,6,rep,name=treasures,proto3" json:"treasures,omitempty" protobuf_key:"varint,1,opt,name=key,proto3" protobuf_val:"bytes,2,opt,name=value,proto3"`
	Traps          map[int32]*Trap       `protobuf:"bytes,7,rep,name=traps,proto3" json:"traps,omitempty" protobuf_key:"varint,1,opt,name=key,proto3" protobuf_val:"bytes,2,opt,name=value,proto3"`
	Bullets        map[int32]*Bullet     `protobuf:"bytes,8,rep,name=bullets,proto3" json:"bullets,omitempty" protobuf_key:"varint,1,opt,name=key,proto3" protobuf_val:"bytes,2,opt,name=value,proto3"`
	SpeedShoes     map[int32]*SpeedShoe  `protobuf:"bytes,9,rep,name=speedShoes,proto3" json:"speedShoes,omitempty" protobuf_key:"varint,1,opt,name=key,proto3" protobuf_val:"bytes,2,opt,name=value,proto3"`
	Pumpkins       map[int32]*Pumpkin    `protobuf:"bytes,10,rep,name=pumpkin,proto3" json:"pumpkin,omitempty" protobuf_key:"varint,1,opt,name=key,proto3" protobuf_val:"bytes,2,opt,name=value,proto3"`
	GuardTowers    map[int32]*GuardTower `protobuf:"bytes,11,rep,name=guardTowers,proto3" json:"guardTowers,omitempty" protobuf_key:"varint,1,opt,name=key,proto3" protobuf_val:"bytes,2,opt,name=value,proto3"`
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

const (
	PLAYER_DEFAULT_SPEED = 300 //Hardcoded
	ADD_SPEED            = 100 //Hardcoded
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
		pR.CollidableWorld.DestroyBody(contactingTrap.CollidableBody) //触碰后即刻删除
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
		// TODO: Resume speed of this player later in `battleMainLoop` w.r.t. `Player.FrozenAtGmtMillis`, instead of a delicate timer to prevent thread-safety issues.

    if contactingPlayer != nil{
   		if maxMillisToFreezePerPlayer > (nowMillis - pR.Players[contactingPlayer.Id].FrozenAtGmtMillis) { //由于守护塔的原因暂时不叠加缠住时间
  			//Do nothing
  		} else {
  			pR.Players[contactingPlayer.Id].Speed = 0
  			pR.Players[contactingPlayer.Id].FrozenAtGmtMillis = nowMillis
  			//被冻住同时加速效果消除
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
	Logger.Info("pumpkin has catched the player: ", zap.Any("pumpkinId", pumpkin.LocalIdInBattle), zap.Any("playerId", player.Id))
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
	pPlayer.BattleState = PlayerBattleStateIns.ACTIVE
	pPlayer.FrozenAtGmtMillis = -1       // Hardcoded temporarily.
	pPlayer.Speed = PLAYER_DEFAULT_SPEED // Hardcoded temporarily.
	pPlayer.AddSpeedAtGmtMillis = -1     // Hardcoded temporarily.
	return true
}

func (pR *Room) ReAddPlayerIfPossible(pTmpPlayerInstance *Player) bool {
	if RoomBattleStateIns.PREPARE != pR.State && RoomBattleStateIns.WAITING != pR.State && RoomBattleStateIns.IN_BATTLE != pR.State && RoomBattleStateIns.IN_SETTLEMENT != pR.State {
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
	pEffectiveInRoomPlayerInstance.BattleState = PlayerBattleStateIns.ACTIVE

  Logger.Warn("ReAddPlayerIfPossible finished.", zap.Any("playerId", pTmpPlayerInstance.Id), zap.Any("roomId", pR.Id), zap.Any("roomState", pR.State), zap.Any("roomEffectivePlayerCount", pR.EffectivePlayerCount), zap.Any("player AckingFrameId", pEffectiveInRoomPlayerInstance.AckingFrameId))
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

func (pR *Room) createGuardTower(pAnchor *Vec2D, trapLocalIdInBattle int32, pTsxIns *Tsx) *GuardTower {

	polyLine := pTsxIns.GuardTowerPolyLineList[0]

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

	var pInRangePlayers *InRangePlayerCollection
	pInRangePlayers = pInRangePlayers.Init(10)
	theGuardTower := GuardTower{
		Id:              0,
		LocalIdInBattle: trapLocalIdInBattle,
		X:               pAnchor.X,
		Y:               pAnchor.Y,
		PickupBoundary:  &thePolygon,

		InRangePlayers: pInRangePlayers,
		LastAttackTick: utils.UnixtimeNano(),
	}

	return &theGuardTower
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

func (pR *Room) createTreasure(Type int32, pAnchor *Vec2D, treasureLocalIdInBattle int32, pTsxIns *Tsx) *Treasure {
	var polyLine *TmxPolyline
	if Type == HIGH_SCORE_TREASURE_TYPE {
		polyLine = pTsxIns.HigherTreasurePolyLineList[0]
	}
	if Type == TREASURE_TYPE {
		polyLine = pTsxIns.LowTreasurePolyLineList[0]
	}

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

func (pR *Room) createSpeedShoe(pAnchor *Vec2D, speedShoesLocalIdInBattle int32, pTsxIns *Tsx) *SpeedShoe {
	polyLine := pTsxIns.SpeedShoesPolyLineList[0]

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

	theSpeedShoe := SpeedShoe{
		Id:              0,
		LocalIdInBattle: speedShoesLocalIdInBattle,
		Type:            0,
		X:               pAnchor.X,
		Y:               pAnchor.Y,
		PickupBoundary:  &thePolygon,
	}

	return &theSpeedShoe
}

func (pR *Room) InitGuardTower(pTmxMapIns *TmxMap, pTsxIns *Tsx) {
	for key, value := range pTmxMapIns.GuardTowersInitPosList {
		{
			pAnchor := &Vec2D{
				X: float64(value.X),
				Y: float64(value.Y),
			}
			tower := pR.createGuardTower(pAnchor, int32(key), pTsxIns)
			pR.GuardTowers[tower.LocalIdInBattle] = tower
		}
	}
	Logger.Info("InitGuardTower finished:", zap.Any("roomId", pR.Id), zap.Any("traps", pR.Traps))
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
			theTreasure := pR.createTreasure(value.Type, pAnchor, int32(key), pTsxIns)
			theTreasure.Score = value.Score
			theTreasure.Type = value.Type
			/*
				      if (true == theTreasure.Removed) {
				        // A useless proof of "no memory contamination for consecutive battles in a same room". -- YFLu
					      Logger.Info("A treasure initiated with .Removed == true:", zap.Any("roomId", pR.Id), zap.Any("localIdInBattle", theTreasure.LocalIdInBattle))
				      }
			*/
			pR.Treasures[theTreasure.LocalIdInBattle] = theTreasure
		}
	}
	for key, value := range pTmxMapIns.HighTreasuresInfo {
		{
			pAnchor := &Vec2D{
				X: float64(value.InitPos.X),
				Y: float64(value.InitPos.Y),
			}
			theTreasure := pR.createTreasure(value.Type, pAnchor, int32(key), pTsxIns)
			theTreasure.Score = value.Score
			theTreasure.Type = value.Type
			/*
				      if (true == theTreasure.Removed) {
				        // A useless proof of "no memory contamination for consecutive battles in a same room". -- YFLu
					      Logger.Info("A treasure initiated with .Removed == true:", zap.Any("roomId", pR.Id), zap.Any("localIdInBattle", theTreasure.LocalIdInBattle))
				      }
			*/
			pR.Treasures[theTreasure.LocalIdInBattle] = theTreasure
		}
	}
	Logger.Info("InitTreasures finished:", zap.Any("roomId", pR.Id), zap.Any("# of treasures", len(pR.Treasures)))
}

func (pR *Room) InitSpeedShoes(pTmxMapIns *TmxMap, pTsxIns *Tsx) {
	for key, value := range pTmxMapIns.SpeedShoesList {
		pAnchor := &Vec2D{
			X: float64(value.InitPos.X),
			Y: float64(value.InitPos.Y),
		}
		theSpeedShoe := pR.createSpeedShoe(pAnchor, int32(key), pTsxIns)
		theSpeedShoe.Type = value.Type
		pR.SpeedShoes[theSpeedShoe.LocalIdInBattle] = theSpeedShoe
	}
	Logger.Info("InitSpeedShoes finished:", zap.Any("roomId", pR.Id), zap.Any("speedshoes", pR.SpeedShoes))
}

func (pR *Room) InitPumpkins(pTmxMapIns *TmxMap) {
	for key, value := range pTmxMapIns.Pumpkins {
		p := &Pumpkin{}
		p.LocalIdInBattle = int32(key)
		p.LinearSpeed = 0.0000004
		p.X = value.X
		p.Y = value.Y
		p.Dir = &Direction{rand.Float64(), rand.Float64()} // todo
		pR.Pumpkins[p.LocalIdInBattle] = p
	}
}

//从layers获取所有遮挡物的tile, 然后根据gid获取坐标,
//从tsx获取对应的多边形线条, 初始化一个Boundary
//
func (pR *Room) InitBarrier(pTmxMapIns *TmxMap, pTsxIns *Tsx) {
	for _, lay := range pTmxMapIns.Layers {
		if lay.Name != "tile_1 human skeleton" && lay.Name != "tile_1 board" && lay.Name != "tile_1 stone" {
			continue
		}
		for index, tile := range lay.Tile {
			if tile == nil || tile.Tileset == nil {
				continue
			}
			if tile.Tileset.Source != "tile_1.tsx" {
				continue
			}

			barrier := &Barrier{}
			//Set coord
			barrier.X, barrier.Y = pTmxMapIns.getCoordByGid(index)
			barrier.Type = tile.Id
			if v, ok := pTsxIns.BarrierPolyLineList[int(tile.Id)]; ok {
				thePoints := make([]*Vec2D, 0)
				for _, p := range v.Points {
					thePoints = append(thePoints, &Vec2D{
						X: p.X,
						Y: p.Y,
					})
				}
				//Get points
				barrier.Boundary = &Polygon2D{Points: thePoints}
			}

			//Get body def by X,Y
			var bdDef box2d.B2BodyDef
			bdDef = box2d.MakeB2BodyDef()
			bdDef.Type = box2d.B2BodyType.B2_staticBody
			bdDef.Position.Set(barrier.X, barrier.Y)
			b2BarrierBody := pR.CollidableWorld.CreateBody(&bdDef)

			//Get fixture def by Points
			fd := box2d.MakeB2FixtureDef()
			if barrier.Boundary != nil {
				b2Vertices := make([]box2d.B2Vec2, len(barrier.Boundary.Points))
				for vIndex, v2 := range barrier.Boundary.Points {
					b2Vertices[vIndex] = v2.ToB2Vec2()
				}
				b2PolygonShape := box2d.MakeB2PolygonShape()
				b2PolygonShape.Set(b2Vertices, len(barrier.Boundary.Points))
				fd.Shape = &b2PolygonShape
			} else {
				b2CircleShape := box2d.MakeB2CircleShape()
				b2CircleShape.M_radius = 32
				fd.Shape = &b2CircleShape
			}

			fd.Filter.CategoryBits = COLLISION_CATEGORY_BARRIER
			fd.Filter.MaskBits = COLLISION_MASK_FOR_BARRIER
			fd.Density = 0.0
			b2BarrierBody.CreateFixtureFromDef(&fd)

			barrier.CollidableBody = b2BarrierBody
			b2BarrierBody.SetUserData(barrier)
			pR.Barriers[int32(index)] = barrier
		}
	}
}

func (pR *Room) InitColliders() {
	gravity := box2d.MakeB2Vec2(0.0, 0.0)
	world := box2d.MakeB2World(gravity)
	world.SetContactFilter(&box2d.B2ContactFilter{})
	pR.CollidableWorld = &world

	Logger.Info("InitColliders for pR.Players:", zap.Any("roomId", pR.Id))
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

	Logger.Info("InitColliders for pR.Pumpkins:", zap.Any("roomId", pR.Id))
	for _, p := range pR.Pumpkins {
		var bdDef box2d.B2BodyDef
		bdDef = box2d.MakeB2BodyDef()
		bdDef.Type = box2d.B2BodyType.B2_dynamicBody
		bdDef.Position.Set(p.X, p.Y)

		b2PumpkinBody := pR.CollidableWorld.CreateBody(&bdDef)

		b2CircleShape := box2d.MakeB2CircleShape()
		b2CircleShape.M_radius = 32

		fd := box2d.MakeB2FixtureDef()
		fd.Shape = &b2CircleShape
		fd.Filter.CategoryBits = COLLISION_CATEGORY_PUMPKIN
		fd.Filter.MaskBits = COLLISION_MASK_FOR_PUMPKIN
		fd.Density = 0.0
		b2PumpkinBody.CreateFixtureFromDef(&fd)

		p.CollidableBody = b2PumpkinBody
		b2PumpkinBody.SetUserData(p)
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

		b2TrapBody := pR.CollidableWorld.CreateBody(&bdDef)

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
		b2TrapBody.CreateFixtureFromDef(&fd)

		trap.CollidableBody = b2TrapBody
		b2TrapBody.SetUserData(trap)
	}

	//kobako: init guardTower
	Logger.Info("InitColliders for pR.GuardTowers:", zap.Any("roomId", pR.Id))
	for _, tower := range pR.GuardTowers {
		var bdDef box2d.B2BodyDef
		bdDef.Type = box2d.B2BodyType.B2_dynamicBody
		bdDef = box2d.MakeB2BodyDef()
		bdDef.Position.Set(tower.PickupBoundary.Anchor.X, tower.PickupBoundary.Anchor.Y)

		b2TrapBody := pR.CollidableWorld.CreateBody(&bdDef)

		pointsCount := len(tower.PickupBoundary.Points)

		b2Vertices := make([]box2d.B2Vec2, pointsCount)
		for vIndex, v2 := range tower.PickupBoundary.Points {
			b2Vertices[vIndex] = v2.ToB2Vec2()
		}

		b2PolygonShape := box2d.MakeB2PolygonShape()
		b2PolygonShape.Set(b2Vertices, pointsCount)

		fd := box2d.MakeB2FixtureDef()
		fd.Shape = &b2PolygonShape
		fd.Filter.CategoryBits = COLLISION_CATEGORY_TRAP
		fd.Filter.MaskBits = COLLISION_MASK_FOR_TRAP
		fd.Density = 0.0
		b2TrapBody.CreateFixtureFromDef(&fd)

		tower.CollidableBody = b2TrapBody
		b2TrapBody.SetUserData(tower)
	}

	Logger.Info("InitColliders for pR.SpeedShoes:", zap.Any("roomId", pR.Id))
	for _, v := range pR.SpeedShoes {
		var bdDef box2d.B2BodyDef
		bdDef.Type = box2d.B2BodyType.B2_dynamicBody
		bdDef = box2d.MakeB2BodyDef()
		bdDef.Position.Set(v.PickupBoundary.Anchor.X, v.PickupBoundary.Anchor.Y)

		b2SpeedShoeBody := pR.CollidableWorld.CreateBody(&bdDef)

		pointsCount := len(v.PickupBoundary.Points)

		b2Vertices := make([]box2d.B2Vec2, pointsCount)
		for vIndex, v2 := range v.PickupBoundary.Points {
			b2Vertices[vIndex] = v2.ToB2Vec2()
		}

		b2PolygonShape := box2d.MakeB2PolygonShape()
		b2PolygonShape.Set(b2Vertices, pointsCount)

		fd := box2d.MakeB2FixtureDef()
		fd.Shape = &b2PolygonShape
		fd.Filter.CategoryBits = COLLISION_CATEGORY_SPEED_SHOES
		fd.Filter.MaskBits = COLLISION_MASK_FOR_SPEED_SHOES
		fd.Density = 0.0
		b2SpeedShoeBody.CreateFixtureFromDef(&fd)

		v.CollidableBody = b2SpeedShoeBody
		b2SpeedShoeBody.SetUserData(v)
		//PrettyPrintBody(v.CollidableBody)
	}
}

func (pR *Room) InitContactListener() {
	listener := Listener{
		name: "kobako",
		room: pR,
	}
	pR.CollidableWorld.SetContactListener(listener)
}

//currentFrame 是服务器目前所知的所有信息, lastFrame 是该玩家已知的帧
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
		SpeedShoes:     make(map[int32]*SpeedShoe, 0),
		Pumpkins:       currentFrame.Pumpkins,
		GuardTowers:    make(map[int32]*GuardTower, 0),
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
		/*
		 * The use of 'bullet.RemovedAtFrameId' implies that you SHOULDN'T create a record '&Bullet{Removed: true}' here after it's already deleted from 'room.Bullets'. Same applies for `Traps` and `SpeedShoes`.
		 *
		 * -- YFLu
		 */
		if false == ok {
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

func diffSpeedShoe(last, curr *SpeedShoe) (bool, *SpeedShoe) {
	speedShoe := &SpeedShoe{}
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

	relativePath := "../frontend/assets/resources/map/pacman/map.tmx"
	execPath, err := os.Executable()
	ErrFatal(err)

	pwd, err := os.Getwd()
	ErrFatal(err)

	Logger.Info("StartBattle filepaths", zap.Any("execPath", execPath), zap.Any("pwd", pwd))

	tmxMapIns := TmxMap{}
	pTmxMapIns := &tmxMapIns
	fp := filepath.Join(pwd, relativePath)
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

	tsxIns := Tsx{}
	pTsxIns := &tsxIns
	//relativePath = "../frontend/assets/resources/map/tile_1.tsx"
	relativePath = "../frontend/assets/resources/map/pacman/Tile_W64_H64_S01.tsx"
	fp = filepath.Join(pwd, relativePath)
	if !filepath.IsAbs(fp) {
		panic("Filepath must be absolute!")
	}

	byteArr, err = ioutil.ReadFile(fp)
	ErrFatal(err)
	DeserializeToTsxIns(byteArr, pTsxIns)

	//kobako
	pR.GuardTowers = make(map[int32]*GuardTower)
	//kobako

	pR.InitTreasures(pTmxMapIns, pTsxIns)
	pR.InitTraps(pTmxMapIns, pTsxIns)
	pR.InitGuardTower(pTmxMapIns, pTsxIns)
	pR.InitPumpkins(pTmxMapIns)
	pR.InitSpeedShoes(pTmxMapIns, pTsxIns)
	pR.InitColliders()
	pR.InitBarrier(pTmxMapIns, pTsxIns)

	//kobako: 初始化listener, 如果需要监听BeginContact或者EndContact事件, hack这个函数
	pR.InitContactListener()
	//kobako

	// Always instantiates a new channel and let the old one die out due to not being retained by any root reference.
	pR.CmdFromPlayersChan = make(chan interface{}, (MAGIC_REMOVED_AT_FRAME_ID_PERMANENT_REMOVAL_MARGIN << 2) /* Hardcoded temporarily. Note that a `GolangChannel` whose size is too large would induce "large RAM use of the overall process" and thus cause frequent websocket disconnection in this game. */)
	nanosPerFrame := 1000000000 / int64(pR.ServerFPS)
	secondsPerFrame := float64(1) / float64(pR.ServerFPS)
	velocityIterationsPerFrame := 0
	positionIterationsPerFrame := 0
	pR.Tick = 0
	maxMillisToFreezePerPlayer := int64(5000)   // Hardcoded temporarily.
	maxMillisToAddSpeedPerPlayer := int64(3000) // Hardcoded temporarily.
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

		hardcodedAttackInterval := int64(4 * 1000 * 1000 * 1000) //守护塔攻击频率4秒
		//perPlayerSafeTime := int64(8 * 1000 * 1000 * 1000) //玩家受击后的保护时间

    BULLET_MAX_DIST := 600.0 //移动600个像素点距离后消失

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
				SpeedShoes:     pR.SpeedShoes,
				Pumpkins:       pR.Pumpkins,
				GuardTowers:    pR.GuardTowers,
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
				if player.BattleState == PlayerBattleStateIns.DISCONNECTED || player.BattleState == PlayerBattleStateIns.LOST {
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
					theBytes, marshalErr := proto.Marshal(diffFrame)
					if marshalErr != nil {
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
			for _, player := range pR.Players { //被蜘蛛网网住
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

        //kobako: 如果超出最大飞行距离, 标记消失
        if BULLET_MAX_DIST < Distance(bullet.StartAtPoint, &Vec2D{
          X: bullet.X,
          Y: bullet.Y,
        }){
          pR.onBulletCrashed(nil, bullet, 0, 0)
        }
			}


			for _, pumpkin := range pR.Pumpkins { //移动南瓜
				if pumpkin.Removed {
					continue
				}
				elapsedMag := pumpkin.LinearSpeed * float64(nanosPerFrame)
				newB2Vec2Pos := box2d.MakeB2Vec2(pumpkin.X+float64(elapsedMag)*pumpkin.Dir.Dx, pumpkin.Y+float64(elapsedMag)*pumpkin.Dir.Dy)
				MoveDynamicBody(pumpkin.CollidableBody, &newB2Vec2Pos, 0)
				pumpkin.X = newB2Vec2Pos.X
				pumpkin.Y = newB2Vec2Pos.Y
			}

			pR.CollidableWorld.Step(secondsPerFrame, velocityIterationsPerFrame, positionIterationsPerFrame)

			//kobako: 对于所有GuardTower, 如果攻击列表不为空, 判断是否发射子弹
			for _, tower := range pR.GuardTowers {
				if tower.InRangePlayers.CurrentSize < 1 {
					continue
				}
				now := utils.UnixtimeNano()

				/*
				 * 顺序攻击
				 */
				if now-tower.LastAttackTick > hardcodedAttackInterval {
					tower.LastAttackTick = now

					playerNode := tower.InRangePlayers.NextPlayerToAttack()
					startPos := Vec2D{
						X: tower.CollidableBody.GetPosition().X,
						Y: tower.CollidableBody.GetPosition().Y,
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
							pR.onTrapPickedUp(player, v) //触发陷阱
						case *GuardTower:
							//这部分的操作在Listener做
						case *Bullet:
							pR.onBulletCrashed(player, v, collisionNowMillis, maxMillisToFreezePerPlayer)
						case *SpeedShoe:
							pR.onSpeedShoePickedUp(player, v, collisionNowMillis)
						default:
							Logger.Warn("player Collision ", zap.Any("playerId", player.Id), zap.Any("collision", v))
						}
					}
				}
			}

			for _, pumpkin := range pR.Pumpkins { //南瓜撞到墙和玩家产生的回调
				for edge := pumpkin.CollidableBody.GetContactList(); edge != nil; edge = edge.Next {
					if edge.Contact.IsTouching() {
						if barrier, ok := edge.Other.GetUserData().(*Barrier); ok {
							pR.onPumpkinEncounterBarrier(pumpkin, barrier)
						} else if player, ok := edge.Other.GetUserData().(*Player); ok {
							pR.onPumpkinEncounterPlayer(pumpkin, player)
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
		assembledFrame := &RoomDownsyncFrame{
			Id:             pR.Tick,
			RefFrameId:     0, // Hardcoded for now.
			Players:        pR.Players,
			SentAt:         utils.UnixtimeMilli(),
			CountdownNanos: -1, // TODO: Replace this magic constant!
			Treasures:      pR.Treasures,
			Traps:          pR.Traps,
			Bullets:        pR.Bullets,
			SpeedShoes:     pR.SpeedShoes,
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
	Logger.Info("Battle state transitted to RoomBattleStateIns.PREPARE for:", zap.Any("roomId", pR.Id))
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
	pR.GuardTowers = make(map[int32]*GuardTower)
	pR.Bullets = make(map[int32]*Bullet)
	pR.SpeedShoes = make(map[int32]*SpeedShoe)
	pR.PlayerDownsyncChanDict = make(map[int32]chan string)
	for indice, _ := range pR.JoinIndexBooleanArr {
		pR.JoinIndexBooleanArr[indice] = false
	}
	pR.CmdFromPlayersChan = nil
	pR.RoomDownsyncFrameBuffer = NewRingBuffer(512)
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
    //启动timer十秒后发起http请求唤起机器人加入房间, refer to https://shimo.im/docs/4WLFqyAtAioMJLc9 #119.4  --kobako
    go func(pR *Room){
      fmt.Println("进入等待状态, 启动Timer")
      <-time.After(10 * time.Second)
      fmt.Println("等待了十秒, 唤起bot玩家加入房间" + fmt.Sprintf("http://%s:%d/spawnBot?expectedRoomId=%d","localhost", 15351, pR.Id))
      if(pR.State == RoomBattleStateIns.WAITING){
        //发送http请求
        //TODO: 错误处理. 如果请求失败(如已经没有空闲机器人了)怎么处理? 
        http.Get(fmt.Sprintf("http://%s:%d/spawnBot?expectedRoomId=%d","localhost", 15351, pR.Id))
      }
    }(pR)
	}
	Logger.Info("onPlayerAdded", zap.Any("roomId", pR.Id), zap.Any("pR.JoinIndexBooleanArr", pR.JoinIndexBooleanArr))
	for index, value := range pR.JoinIndexBooleanArr {
		if false == value {
			pR.Players[playerId].JoinIndex = int32(index) + 1
			pR.JoinIndexBooleanArr[index] = true
			break
		}
	}
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

	if pR.Capacity == len(pR.Players) {
		pR.StartBattle()
	}

  pR.updateScore()
	Logger.Info("onPlayerAdded:", zap.Any("playerId", playerId), zap.Any("roomId", pR.Id), zap.Any("joinIndex", pR.Players[playerId].JoinIndex), zap.Any("EffectivePlayerCount", pR.EffectivePlayerCount), zap.Any("RoomBattleState", pR.State))
}

func (pR *Room) onPlayerReAdded(playerId int32) {
	for index, value := range pR.JoinIndexBooleanArr {
		if false == value {
			pR.Players[playerId].JoinIndex = int32(index) + 1
			pR.JoinIndexBooleanArr[index] = true
			break
		}
	}
	Logger.Info("Room got `onPlayerReAdded` invoked,", zap.Any("roomId", pR.Id), zap.Any("playerId", playerId), zap.Any("JoinIndexBooleanArr", pR.JoinIndexBooleanArr))
	pR.updateScore()
}

type Listener struct {
	name string
	room *Room
}

//kobako: Implement interface Start
func (l Listener) BeginContact(contact box2d.B2ContactInterface) {
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

func (l Listener) EndContact(contact box2d.B2ContactInterface) {
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

func (l Listener) PreSolve(contact box2d.B2ContactInterface, oldManifold box2d.B2Manifold) {
	//fmt.Printf("I am PreSolve %s\n", l.name);
}

func (l Listener) PostSolve(contact box2d.B2ContactInterface, impulse *box2d.B2ContactImpulse) {
	//fmt.Printf("PostSolve %s\n", l.name);
}

//Implement interface End
