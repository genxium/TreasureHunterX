package models

import (
	"database/sql"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type Player struct {
	CreatedAt     int64      `json:"created_at" db:"created_at"`
	DeletedAt     NullInt64  `json:"deleted_at" db:"deleted_at"`
	DisplayName   NullString `json:"display_name" db:"display_name"`
	ID            int        `json:"id" db:"id"`
	Name          string     `json:"name" db:"name"`
	UpdatedAt     int64      `json:"updated_at" db:"updated_at"`
	TutorialStage int        `json:"tutorial_stage" db:"tutorial_stage"`
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
