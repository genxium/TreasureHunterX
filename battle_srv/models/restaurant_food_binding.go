package models

import (
	"database/sql"
	"github.com/jmoiron/sqlx"
	. "server/common"
	"server/storage"

	sq "github.com/Masterminds/squirrel"
	"go.uber.org/zap"
)

type RestaurantFoodBinding struct {
	ID                  int `json:"id" db:"id"`
	RestaurantID        int `json:"restaurantId" db:"restaurant_id"`
	FoodID              int `json:"foodId" db:"food_id"`
	GetOrder            int `json:"getOrder" db:"get_order"`
	GetFoodCostCurrency int `json:"getFoodCostCurrency" db:"get_food_cost_currency"`
	GetFoodCostVal      int `json:"getFoodCostVal" db:"get_food_cost_value"`
}

func (f *RestaurantFoodBinding) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "restaurant_food_binding", []string{"restaurant_id, food_id, get_order, get_food_cost_currency, get_food_cost_value"}, []interface{}{f.RestaurantID, f.FoodID, f.GetOrder, f.GetFoodCostCurrency, f.GetFoodCostVal})
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	f.ID = int(id)
	return nil
}
func GetRestaurantFoodBindingList(restaurantId int) ([]*RestaurantFoodBinding, error) {
	var ls []*RestaurantFoodBinding
	query, args, err := sq.Select("*").From("restaurant_food_binding").Where(sq.Eq{"restaurant_id": restaurantId}).ToSql()
	if err != nil {
		return nil, err
	}
	//query = storage.MySQLManagerIns.Rebind(query)
	Logger.Debug("restaurantFoodBindingList",
		zap.String("sql", query), zap.Any("args", args))

	err = storage.MySQLManagerIns.Select(&ls, query, args...)
	//Logger.Debug("getList", zap.Error(err))
	return ls, err
}

func GetRestaurantFoodBindingByGetOrderAndRestaurantID(getOrder int, restaurantId int) (*RestaurantFoodBinding, error) {
	var v RestaurantFoodBinding
	err := getObj("restaurant_food_binding", sq.Eq{"get_order": getOrder, "restaurant_id": restaurantId}, &v)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &v, nil
}
