package models

import (
  "database/sql"

  sq "github.com/Masterminds/squirrel"
  "github.com/jmoiron/sqlx"
)

type PlayerAuthBinding struct {
  Channel   int       `json:"channel" db:"channel"`
  CreatedAt int64     `json:"created_at" db:"created_at"`
  DeletedAt NullInt64 `json:"deleted_at" db:"deleted_at"`
  ExtAuthID string    `json:"ext_auth_id" db:"ext_auth_id"`
  PlayerID  int       `json:"player_id" db:"player_id"`
  UpdatedAt int64     `json:"updated_at" db:"updated_at"`
}

func (p *PlayerAuthBinding) Insert(tx *sqlx.Tx) error {
  _, err := txInsert(tx, "player_auth_binding", []string{"channel", "created_at", "ext_auth_id",
    "player_id", "updated_at"},
    []interface{}{p.Channel, p.CreatedAt, p.ExtAuthID, p.PlayerID, p.UpdatedAt})
  return err
}

func GetPlayerAuthBinding(channel int, extAuthID string) (*PlayerAuthBinding, error) {
  var p PlayerAuthBinding
  err := getObj("player_auth_binding",
    sq.Eq{"channel": channel, "ext_auth_id": extAuthID, "deleted_at": nil},
    &p)
  if err == sql.ErrNoRows {
    return nil, nil
  }
  return &p, nil
}
