package models

import (
	"database/sql"
	"github.com/jmoiron/sqlx"
	. "server/common"
	"server/storage"

	sq "github.com/Masterminds/squirrel"
	"go.uber.org/zap"
)

type Cook struct {
	ID                int    `json:"id" db:"id"`
	DisplayName       string `json:"displayName" db:"display_name"`
	NumFood           int    `json:"numFood" db:"num_food"`
	GoldAddition      int    `json:"goldAddition" db:"gold_addition"`
	EnergyAddition    int    `json:"energyAddition" db:"energy_addition"`
	WorkingTime       int    `json:"workingTime" db:"working_time"`
	MaxGoldAddition   int    `json:"maxGoldAddition" db:"max_gold_addition"`
	MaxEnergyAddition int    `json:"maxEnergyAddition" db:"max_energy_addition"`
	MaxWorkingTime    int    `json:"maxWorkingTime" db:"max_working_time"`
	Cooperation       int    `json:"cooperation" db:"cooperation"`
	MaxCooperation    int    `json:"maxCooperation" db:"max_cooperation"`
}

func (c *Cook) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "cook", []string{"display_name, num_food, gold_addition, energy_addition, working_time, max_gold_addition, max_energy_addition, max_working_time, max_cooperation, cooperation"}, []interface{}{c.DisplayName, c.NumFood, c.GoldAddition, c.EnergyAddition, c.WorkingTime, c.MaxGoldAddition, c.MaxEnergyAddition, c.MaxWorkingTime, c.MaxCooperation, c.Cooperation})
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	c.ID = int(id)
	return nil
}

func GetCookList() ([]*Cook, error) {
	var ls []*Cook
	query, args, err := sq.Select("*").From("cook").ToSql()
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

func GetCookById(id int) (*Cook, error) {
	var tmp Cook
	err := getObj("cook", sq.Eq{"id": id}, &tmp)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &tmp, nil
}
func GetCookListByIds(ids []int) ([]*Cook, error) {
	var ls []*Cook
	query, args, err := sq.Select("*").From("cook").Where(sq.Eq{"id": ids}).ToSql()
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
