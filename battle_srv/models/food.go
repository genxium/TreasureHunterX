package models

import (
	"database/sql"
	"github.com/jmoiron/sqlx"
	. "server/common"
	"server/storage"

	sq "github.com/Masterminds/squirrel"
	"go.uber.org/zap"
)

type Food struct {
	ID           int    `json:"id" db:"id"`
	DisplayName  string `json:"displayName" db:"display_name"`
	Price        int    `json:"price" db:"price"`
	EnergyOutput int    `json:"energyOutput" db:"energy_output"`
}

func (f *Food) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "food", []string{"id, display_name, price, energy_output"}, []interface{}{f.ID, f.DisplayName, f.Price, f.EnergyOutput})
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

func GetFoodListByIds(ids []int) ([]*Food, error) {
	var ls []*Food
	query, args, err := sq.Select("*").From("food").Where(sq.Eq{"id": ids}).ToSql()
	if err != nil {
		return nil, err
	}
	//query = storage.MySQLManagerIns.Rebind(query)
	Logger.Debug("foodList",
		zap.String("sql", query), zap.Any("args", args))

	err = storage.MySQLManagerIns.Select(&ls, query, args...)
	//Logger.Debug("getList", zap.Error(err))
	return ls, err
}

func GetFoodById(id int) (*Food, error) {
	var v Food
	err := getObj("food", sq.Eq{"id": id}, &v)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &v, nil
}
