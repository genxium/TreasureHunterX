package models

import (
	"database/sql"
	. "server/common"
	"server/storage"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
)

type RestaurantLevelBinding struct {
	BuildingOrUpgradingCostCurrency int    `json:"buildingOrUpgradingCostCurrency" db:"building_or_upgrading_cost_currency"`
	BuildingOrUpgradingCostVal      int    `json:"buildingOrUpgradingCostVal" db:"building_or_upgrading_cost_val"`
	BuildingOrUpgradingDuration     int    `json:"buildingOrUpgradingDuration" db:"building_or_upgrading_duration"`
	DiningDuration                  int    `json:"diningDuration" db:"dining_duration"`
	GuestSingleTripDuration         int    `json:"guestSingleTripDuration" db:"guest_single_trip_duration"`
	ID                              int    `json:"id" db:"id"`
	Level                           int    `json:"level" db:"level"`
	NumChairs                       int    `json:"numChairs" db:"num_chairs"`
	RestaurantID                    int    `json:"restaurantId" db:"restaurant_id"`
	TmxPath                         string `json:"-" db:"tmx_path"`
	ServiceCharge                   int    `json:"serviceCharge" db:"service_charge"`
	BusinessTime                    int    `json:"businessTime" db:"business_time"`
}

func GetRestaurantLevelBinding(restaurantId int, lv int) (*RestaurantLevelBinding, error) {
	var v RestaurantLevelBinding
	err := getObj("restaurant_level_binding", sq.Eq{"restaurant_id": restaurantId, "level": lv}, &v)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &v, nil
}

func GetRestaurantLevelBindingList(rids []int) ([]*RestaurantLevelBinding, error) {
	var ls []*RestaurantLevelBinding
	query, args, err := sqlx.In("SELECT * FROM restaurant_level_binding WHERE restaurant_id in (?)", rids)
	if err != nil {
		return nil, err
	}
	query = storage.MySQLManagerIns.Rebind(query)
	Logger.Debug("GetRestaurantLevelBindingList",
		zap.String("sql", query), zap.Any("args", args))

	err = storage.MySQLManagerIns.Select(&ls, query, args...)
	//Logger.Debug("getList", zap.Error(err))
	return ls, err

}

func (r *RestaurantLevelBinding) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "restaurant_level_binding", []string{"business_time, service_charge, building_or_upgrading_cost_currency", "building_or_upgrading_cost_val", "building_or_upgrading_duration", "dining_duration", "guest_single_trip_duration", "level", "num_chairs", "restaurant_id", "tmx_path"}, []interface{}{r.BusinessTime, r.ServiceCharge, r.BuildingOrUpgradingCostCurrency, r.BuildingOrUpgradingCostVal, r.BuildingOrUpgradingDuration, r.DiningDuration, r.GuestSingleTripDuration, r.Level, r.NumChairs, r.RestaurantID, r.TmxPath})
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	r.ID = int(id)
	return nil
}
