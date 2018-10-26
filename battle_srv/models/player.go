package models

import (
	"database/sql"
	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

// Use type `float64` for json unmarshalling of numbers.
type Direction struct {
	Dx float64 `json:"dx"`
	Dy float64 `json:"dy"`
}

type PlayerBattleState struct {
	ACTIVE                    int
	DISCONNECTED              int
	LOST                      int
	EXPELLED_DURING_GAME      int
	EXPELLED_IN_DISMISSAL     int
}

var PlayerBattleStateIns PlayerBattleState

func InitPlayerBattleStateIns() {
	PlayerBattleStateIns = PlayerBattleState{
		ACTIVE:                           0,
		DISCONNECTED:                     1,
		LOST:                             2,
		EXPELLED_DURING_GAME:             3,
		EXPELLED_IN_DISMISSAL:            4,
	}
}

type Player struct {
	ID                int        `json:"id" db:"id"`
	X                 float64    `json:"x"`
	Y                 float64    `json:"y"`
	Dir               Direction  `json:"dir"`
	Speed             int        `json:"speed"`
  BattleState       int        `json:"battleState"`
	LastMoveGmtMillis int        `json:"lastMoveGmtMillis"`
	Name              string     `json:"name" db:"name"`
	DisplayName       NullString `json:"displayName" db:"display_name"`
	CreatedAt         int64      `json:"-" db:"created_at"`
	UpdatedAt         int64      `json:"-" db:"updated_at"`
	DeletedAt         NullInt64  `json:"-" db:"deleted_at"`
	TutorialStage     int        `json:"-" db:"tutorial_stage"`
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
	p.ID = int(id)
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
