package models

import (
	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type CookUpgradeData struct {
	ID                  int `json:"id" db:"id"`
	UpgradeDuration     int `json:"upgradeDuration" db:"upgrade_duration"`
	UpgradeCostVal      int `json:"upgradeCostVal" db:"upgrade_cost_val"`
	UpgradeCostCurrency int `json:"upgradeCostCurrency" db:"upgrade_cost_currency"`
	AddGoldAddition     int `json:"addGoldAddition" db:"add_gold_addition"`
	AddEnergyAddition   int `json:"addEnergyAddition" db:"add_energy_addition"`
	AddWorkingTime      int `json:"addWorkingTime" db:"add_working_time"`
}

func (c *CookUpgradeData) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "cook_upgrade_data", []string{"upgrade_duration, upgrade_cost_currency, upgrade_cost_val, add_working_time, add_energy_addition, add_gold_addition"}, []interface{}{c.UpgradeDuration, c.UpgradeCostCurrency, c.UpgradeCostVal, c.AddWorkingTime, c.AddEnergyAddition, c.AddGoldAddition})
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

func GetCookUpgradeData(id int) (*CookUpgradeData, error) {
	var tmp *CookUpgradeData
	err := getObj("cook_upgrade_data", sq.Eq{"id": id}, &tmp)
	if err != nil {
		return nil, err
	}
	return tmp, nil
}
