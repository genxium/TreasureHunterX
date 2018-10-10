package models

import (
	"database/sql"
	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
	. "server/common"
	"server/common/utils"
	"server/storage"
)

type PlayerRestaurantFoodBinding struct {
	ID           int       `json:"id" db:"id"`
	PlayerID     int       `json:"playerId" db:"player_id"`
	FoodID       int       `json:"foodId" db:"food_id"`
	RestaurantID int       `json:"restaurantId" db:"restaurant_id"`
	CreatedAt    int64     `json:"-" db:"created_at"`
	UpdatedAt    int64     `json:"-" db:"updated_at"`
	DeletedAt    NullInt64 `json:"-" db:"deleted_at"`
}

func NewPlayerRestaurantFoodBinding(playerId int, foodId int, restaurantId int) *PlayerRestaurantFoodBinding {
	now := utils.UnixtimeMilli()
	v := &PlayerRestaurantFoodBinding{
		PlayerID:     playerId,
		FoodID:       foodId,
		RestaurantID: restaurantId,
		CreatedAt:    now,
		UpdatedAt:    now,
	}
	return v
}

func (p *PlayerRestaurantFoodBinding) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "player_restaurant_food_binding", []string{"player_id", "restaurant_id", "food_id", "created_at", "updated_at"}, []interface{}{p.PlayerID, p.RestaurantID, p.FoodID, p.CreatedAt, p.UpdatedAt})
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

func GetPlayerRestaurantFoodBindingByPlayerIdAndRestaurantId(playerId int, restaurantId int) (*PlayerRestaurantFoodBinding, error) {
	var tmp PlayerRestaurantFoodBinding
	err := getObj("player_restaurant_food_binding", sq.Eq{"player_id": playerId, "restaurant_id": restaurantId, "deleted_at": nil}, &tmp)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &tmp, nil
}
func GetPlayerRestaurantFoodBindingList(playerId int, restaurantId int) ([]*PlayerRestaurantFoodBinding, error) {
	var ls []*PlayerRestaurantFoodBinding
	query, args, err := sq.Select("*").From("player_restaurant_food_binding").Where(sq.Eq{"restaurant_id": restaurantId, "player_id": playerId, "deleted_at": nil}).ToSql()
	if err != nil {
		return nil, err
	}
	//query = storage.MySQLManagerIns.Rebind(query)
	Logger.Debug("playerRestaurantFoodBindingList",
		zap.String("sql", query), zap.Any("args", args))

	err = storage.MySQLManagerIns.Select(&ls, query, args...)
	//Logger.Debug("getList", zap.Error(err))
	return ls, err
}
func GetPlayerRestaurantFoodBindingCount(playerId int, restaurantId int) (int, error) {
	return getCount("player_restaurant_food_binding", sq.Eq{"player_id": playerId, "restaurant_id": restaurantId})

}
