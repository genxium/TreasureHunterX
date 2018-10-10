package models

import (
	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type Belonging struct {
	CreatedAt int64     `json:"-" db:"created_at"`
	DeletedAt NullInt64 `json:"-" db:"deleted_at"`
	Gid       int       `json:"gid" db:"gid"`
	ID        int       `json:"id" db:"id"`
	UpdatedAt int64     `json:"-" db:"updated_at"`
}

func GetBelongingGid(id int) (int, error) {
	var p Belonging
	err := getFields("belonging", []string{"gid"},
		sq.Eq{"id": id, "deleted_at": nil},
		&p)
	return p.Gid, err
}

func (b *Belonging) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "belonging", []string{"gid", "created_at", "updated_at"},
		[]interface{}{b.Gid, b.CreatedAt, b.UpdatedAt})
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	b.ID = int(id)
	return nil
}
