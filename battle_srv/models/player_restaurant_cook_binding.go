package models

import (
	"database/sql"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
	. "server/common"
	"server/common/utils"

	sq "github.com/Masterminds/squirrel"
)

type PlayerRestaurantCookBinding struct {
	ID           int       `json:"id" db:"id"`
	PlayerID     int       `json:"playerId" db:"player_id"`
	CookID       int       `json:"cookId" db:"cook_id"`
	RestaurantID int       `json:"restaurantId" db:"restaurant_id"`
	CreatedAt    int64     `json:"-" db:"created_at"`
	UpdatedAt    int64     `json:"-" db:"updated_at"`
	DeletedAt    NullInt64 `json:"-" db:"deleted_at"`
}

func NewPlayerRestaurantCookBinding(playerId int, cookId int, restaurantId int) *PlayerRestaurantCookBinding {
	now := utils.UnixtimeMilli()
	v := &PlayerRestaurantCookBinding{
		PlayerID:     playerId,
		CookID:       cookId,
		RestaurantID: restaurantId,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	return v
}

func (p *PlayerRestaurantCookBinding) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "player_restaurant_cook_binding", []string{"player_id", "restaurant_id",
		"cook_id", "created_at", "updated_at"}, []interface{}{p.PlayerID, p.RestaurantID, p.CookID, p.CreatedAt, p.UpdatedAt})
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

func GetPlayerRestaurantCookBindingByPlayerIdAndCookId(playerId int, cookId int) (*PlayerRestaurantCookBinding, error) {
	var tmp PlayerRestaurantCookBinding
	err := getObj("player_restaurant_cook_binding", sq.Eq{"player_id": playerId, "cook_id": cookId, "deleted_at": nil}, &tmp)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &tmp, nil
}
func GetPlayerRestaurantCookBindingByPlayerIdAndRestaurantId(playerId int, restaurantId int) (*PlayerRestaurantCookBinding, error) {
	var tmp PlayerRestaurantCookBinding
	err := getObj("player_restaurant_cook_binding", sq.Eq{"player_id": playerId, "restaurant_id": restaurantId, "deleted_at": nil}, &tmp)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	if err != sql.ErrNoRows && err != nil {
		Logger.Info("err", zap.Any("dd", err))
		return nil, err
	}
	return &tmp, nil
}

func PlayerRestaurantCookUnBinding(tx *sqlx.Tx, playerId int, restaurantId int, cookId int) (int, error) {
	now := utils.UnixtimeMilli()
	query, args, err := sq.Update("player_restaurant_cook_binding").
		Set("deleted_at", now).
		Where(sq.Eq{"player_id": playerId, "cook_id": cookId}).ToSql()
	if err != nil {
		return Constants.RetCode.MysqlError, err
	}
	result, err := tx.Exec(query, args...)
	if err != nil {
		return Constants.RetCode.MysqlError, err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return Constants.RetCode.MysqlError, err
	}
	ok := rowsAffected >= 1
	if !ok {
		return Constants.RetCode.UnknownError, nil
	}
	return 0, nil
}

func EnsuredPlayerRestaurantCookBinding(playerId int, cookId int) (bool, error) {
	return exist("player_restaurant_cook_binding", sq.Eq{"player_id": playerId, "cook_id": cookId, "deleted_at": nil})
}

func EnsuredPlayerRestaurantCookBindingByRestaurantId(playerId int, restaurantId int) (bool, error) {
	return exist("player_restaurant_cook_binding", sq.Eq{"player_id": playerId, "restaurant_id": restaurantId, "deleted_at": nil})
}
