package models

import (
  sq "github.com/Masterminds/squirrel"
)

type PlayerBelongingBinding struct {
  AnchorX      float32   `json:"anchor_x" db:"anchor_x"`
  AnchorY      float32   `json:"anchor_y" db:"anchor_y"`
  BelongingID  int       `json:"belonging_id" db:"belonging_id"`
  CreatedAt    int64     `json:"-" db:"created_at"`
  DeletedAt    NullInt64 `json:"-" db:"deleted_at"`
  ID           int       `json:"id" db:"id"`
  PlayerID     int       `json:"player_id" db:"player_id"`
  RestaurantID int       `json:"restaurant_id" db:"restaurant_id"`
  UpdatedAt    int64     `json:"-" db:"updated_at"`
}

func GetPlayerBelongingBindingByPIDAndRID(p int, r int) ([]*PlayerBelongingBinding, error) {
  var ls []*PlayerBelongingBinding
  err := getList("player_belonging_binding", sq.Eq{"player_id": p, "restaurant_id": r}, &ls)
  return ls, err
}
