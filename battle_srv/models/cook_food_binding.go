package models

import (
	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
	. "server/common"
	"server/storage"
)

type CookFoodBinding struct {
	ID                    int     `json:"id" db:"id"`
	FoodID                int     `json:"foodId" db:"food_id"`
	CookID                int     `json:"cookId" db:"cook_id"`
	PriceAdditionValue    float64 `json:"priceAdditionValue" db:"price_addition_value"`
	PriceAdditionCurrency int     `json:"priceAdditionCurrency" db:"price_addition_currency"`
}

func (p *CookFoodBinding) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "cook_food_binding", []string{"food_id, cook_id, price_addition_value, price_addition_currency"}, []interface{}{p.FoodID, p.CookID, p.PriceAdditionValue, p.PriceAdditionCurrency})
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

func NewCookFoodBinding(cookId int, fooId int, price_addition_currency int, price_addition_value float64) *CookFoodBinding {
	v := &CookFoodBinding{
		CookID:                cookId,
		FoodID:                fooId,
		PriceAdditionCurrency: price_addition_currency,
		PriceAdditionValue:    price_addition_value,
	}
	return v
}

func GetCookFoodBindingList(cookId int) ([]*CookFoodBinding, error) {
	var ls []*CookFoodBinding
	query, args, err := sq.Select("*").From("cook_food_binding").Where(sq.Eq{"cook_id": cookId}).ToSql()
	if err != nil {
		return nil, err
	}
	//query = storage.MySQLManagerIns.Rebind(query)
	Logger.Debug("cookList",
		zap.String("sql", query), zap.Any("args", args))

	err = storage.MySQLManagerIns.Select(&ls, query, args...)
	//Logger.Debug("getList", zap.Error(err))
	return ls, err
}
