package models

import (
	"database/sql"
	"github.com/ByteArena/box2d"
	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type PlayerBattleState struct {
	ACTIVE                int32
	DISCONNECTED          int32
	LOST                  int32
	EXPELLED_DURING_GAME  int32
	EXPELLED_IN_DISMISSAL int32
}

var PlayerBattleStateIns PlayerBattleState

func InitPlayerBattleStateIns() {
	PlayerBattleStateIns = PlayerBattleState{
		ACTIVE:                0,
		DISCONNECTED:          1,
		LOST:                  2,
		EXPELLED_DURING_GAME:  3,
		EXPELLED_IN_DISMISSAL: 4,
	}
}

type Player struct {
	Id                  int32         `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty" db:"id"`
	X                   float64       `protobuf:"fixed64,2,opt,name=x,proto3" json:"x,omitempty"`
	Y                   float64       `protobuf:"fixed64,3,opt,name=y,proto3" json:"y,omitempty"`
	Dir                 *Direction    `protobuf:"bytes,4,opt,name=dir,proto3" json:"dir,omitempty"`
	Speed               int32         `protobuf:"varint,5,opt,name=speed,proto3" json:"speed,omitempty"`
	BattleState         int32         `protobuf:"varint,6,opt,name=battleState,proto3" json:"battleState,omitempty"`
	LastMoveGmtMillis   int32         `protobuf:"varint,7,opt,name=lastMoveGmtMillis,proto3" json:"lastMoveGmtMillis,omitempty"`
	Name                string        `protobuf:"bytes,8,opt,name=name,proto3" json:"name,omitempty" db:"name"`
	DisplayName         string        `protobuf:"bytes,9,opt,name=displayName,proto3" json:"displayName,omitempty" db:"display_name"`
	Score               int32         `protobuf:"varint,10,opt,name=score,proto3" json:"score,omitempty"`
	Removed             bool          `json:"removed,omitempty"`
	FrozenAtGmtMillis   int64         `json:"-" db:"-"`
	AddSpeedAtGmtMillis int64         `json:"-" db:"-"`
	CreatedAt           int64         `json:"-" db:"created_at"`
	UpdatedAt           int64         `json:"-" db:"updated_at"`
	DeletedAt           NullInt64     `json:"-" db:"deleted_at"`
	TutorialStage       int           `json:"-" db:"tutorial_stage"`
	CollidableBody      *box2d.B2Body `json:"-"`
	AckingFrameId       int32         `json:"ackingFrameId"`
	JoinIndex           int32         `protobuf:"varint,12,opt,name=joinIndex,proto3 " json:"joinIndex"`

	//kobako
	BeLockedAt int64 `json:"-"`
}

func ExistPlayerByName(name string) (bool, error) {
	return exist("player", sq.Eq{"name": name, "deleted_at": nil})
}

func GetPlayerByName(name string) (*Player, error) {
	return getPlayer(sq.Eq{"name": name, "deleted_at": nil})
}

func GetPlayerById(id int) (*Player, error) {
	return getPlayer(sq.Eq{"id": id, "deleted_at": nil})
}

func getPlayer(cond sq.Eq) (*Player, error) {
	var p Player
	err := getObj("player", cond, &p)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	p.Dir = &Direction{
		Dx: 0.0,
		Dy: 0.0,
	}
	return &p, nil
}

func (p *Player) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "player", []string{"name", "display_name", "created_at", "updated_at"},
		[]interface{}{p.Name, p.DisplayName, p.CreatedAt, p.UpdatedAt})
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	p.Id = int32(id)
	return nil
}
func UpdatePlayerTutorialStage(tx *sqlx.Tx, id int) (bool, error) {
	query, args, err := sq.Update("player").
		Set("tutorial_stage", 1).
		Where(sq.Eq{"tutorial_stage": 0, "id": id}).ToSql()
	if err != nil {
		return false, err
	}
	result, err := tx.Exec(query, args...)
	if err != nil {
		return false, err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}
	return rowsAffected >= 1, nil
}
