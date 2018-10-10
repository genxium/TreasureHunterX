package models

import (
	"database/sql"
	"errors"
	. "server/common"
	"server/common/utils"
	"server/storage"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
)

type PlayerRestaurantBinding struct {
	BuildingOrUpgradingStartedAt NullInt64 `json:"buildingOrUpgradingStartedAt" db:"building_or_upgrading_started_at"`
	ID                           int       `json:"id" db:"id"`
	PlayerID                     int       `json:"-" db:"player_id"`
	RestaurantID                 int       `json:"-" db:"restaurant_id"`
	CurrentLevel                 int       `json:"currentLevel" db:"current_level"`
	State                        int       `json:"state" db:"state"`
	WorkState                    int       `json:"workdState" db:"work_state"`
	CachedDiamond                int       `json:"cachedDiamond" db:"cached_diamond"`
	CachedGold                   int       `json:"cachedGold" db:"cached_gold"`
	CachedEnergy                 int       `json:"cachedEnergy" db:"cached_energy"`
	CreatedAt                    int64     `json:"-" db:"created_at"`
	UpdatedAt                    int64     `json:"-" db:"updated_at"`
	DeletedAt                    NullInt64 `json:"-" db:"deleted_at"`
	LastGuestGenAt               NullInt64 `json:"-" db:"last_guest_gen_at"`
}

// Value 0 for IDLE, 1 for building_or_upgrading, // 2 for IDLE_DUE_TO_CANCELLATION_OF_BUILDING_OR_UPGRADING,
// 3 for IDLE_DUE_TO_COMPLETION_OF_BUILDING_OR_UPGRADING
//0 -> 1: 很简单不解释
//1 -> 2: 由“取消建造/升级成功”的下发事件触发
//1 -> 3: 由“建造/升级完成”的下发事件触发 //
//所以任何建筑平时都不会处于0状态的
const (
	RESTAURANT_S_IDLE                  = 0
	RESTAURANT_S_BUILDING_OR_UPGRADING = 1
	RESTAURANT_S_CANCELLATION          = 2
	RESTAURANT_S_COMPLETION            = 3
)
const (
	RESTAURANT_ON_WORK  = 1
	RESTAURANT_OFF_WORK = 0
)

func NewPlayerRestaurantBinding(playerId int, restaurantId int, lv int) *PlayerRestaurantBinding {
	now := utils.UnixtimeMilli()
	v := &PlayerRestaurantBinding{
		PlayerID:                     playerId,
		RestaurantID:                 restaurantId,
		CurrentLevel:                 lv,
		CreatedAt:                    now,
		UpdatedAt:                    now,
		WorkState:                    RESTAURANT_OFF_WORK,
		CachedDiamond:                0,
		CachedGold:                   0,
		CachedEnergy:                 0,
		BuildingOrUpgradingStartedAt: NewNullInt64(now), State: RESTAURANT_S_IDLE,
	}
	return v
}

func (p *PlayerRestaurantBinding) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "player_restaurant_binding",
		[]string{"player_id", "restaurant_id", "current_level",
			"created_at", "updated_at", "building_or_upgrading_started_at, work_state"},
		[]interface{}{p.PlayerID, p.RestaurantID, p.CurrentLevel,
			p.CreatedAt, p.UpdatedAt, p.BuildingOrUpgradingStartedAt, p.WorkState})
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

func GetPlayerRestaurantBinding(id int) (*PlayerRestaurantBinding, error) {
	var v PlayerRestaurantBinding
	err := getObj("player_restaurant_binding", sq.Eq{"id": id, "deleted_at": nil}, &v)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &v, nil
}

func GetPlayerRestaurantBindingByPlayerIdAndRestaurantId(playerId int, restaurantId int) (*PlayerRestaurantBinding, error) {
	var v PlayerRestaurantBinding
	err := getObj("player_restaurant_binding", sq.Eq{"player_id": playerId, "restaurant_id": restaurantId, "deleted_at": nil}, &v)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &v, nil
}

func StartRestaurantUpgrading(tx *sqlx.Tx, id int, now int64) (bool, error) {
	query, args, err := sq.Update("player_restaurant_binding").
		Set("building_or_upgrading_started_at", now).
		Set("updated_at", now).
		Set("state", RESTAURANT_S_BUILDING_OR_UPGRADING).
		Where(sq.Eq{"id": id, "deleted_at": nil}).
		Where(sq.NotEq{"state": RESTAURANT_S_BUILDING_OR_UPGRADING}).ToSql()

	Logger.Debug("StartRestaurantUpgrading", zap.String("sql", query), zap.Any("args", args))
	if err != nil {
		return false, err
	}
	result, err := tx.Exec(query, args...)
	if err != nil {
		return false, err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}
	return rowsAffected >= 1, nil
}

func CancelRestaurantUpgrading(tx *sqlx.Tx, id int, now int64) (bool, error) {
	query, args, err := sq.Update("player_restaurant_binding").
		Set("building_or_upgrading_started_at", nil).
		Set("updated_at", now).
		Set("state", RESTAURANT_S_CANCELLATION).
		Where(sq.Eq{"id": id, "deleted_at": nil}).
		Where(sq.Eq{"state": RESTAURANT_S_BUILDING_OR_UPGRADING}).ToSql()

	Logger.Debug("CancelRestaurantUpgrading", zap.String("sql", query), zap.Any("args", args))
	if err != nil {
		return false, err
	}
	result, err := tx.Exec(query, args...)
	if err != nil {
		return false, err
	}
	rowsAffected, err := result.RowsAffected()
	if err != nil {
		return false, err
	}
	return rowsAffected >= 1, nil
}

func GetPlayerRestaurantBindingList(playerId int, rids []int) ([]*PlayerRestaurantBinding, error) {
	var ls []*PlayerRestaurantBinding
	query, args, err := sq.Select("*").From("player_restaurant_binding").
		Where(sq.Eq{"player_id": playerId, "deleted_at": nil}).ToSql()
	if err != nil {
		return nil, err
	}
	Logger.Debug("GetPlayerRestaurantBindingList",
		zap.String("sql", query), zap.Any("args", args))
	query, args, err = sqlx.In(query+" AND restaurant_id in (?)", append(args, rids)...)
	if err != nil {
		return nil, err
	}
	query = storage.MySQLManagerIns.Rebind(query)
	Logger.Debug("GetPlayerRestaurantBindingList",
		zap.String("sql", query), zap.Any("args", args))

	err = storage.MySQLManagerIns.Select(&ls, query, args...)
	//Logger.Debug("getList", zap.Error(err))
	return ls, err
}

const RESTAURANT_UPGRADE_LV = 1

func CompleteRestaurantUpgrade() error {
	/*
	 * TODO: Remove the use of MySQL "join".
	 */
	query := "update  `player_restaurant_binding` as t1 left join restaurant_level_binding as t2 " +
		"on t1.current_level+?=t2.level and t1.restaurant_id=t2.restaurant_id " +
		"set t1.state=?, t1. building_or_upgrading_started_at=null, t1.current_level=t1.current_level+? " +
		"where t1.state=? and t1.building_or_upgrading_started_at+t2.building_or_upgrading_duration <= ?"

	_, err := storage.MySQLManagerIns.Exec(query, RESTAURANT_UPGRADE_LV, RESTAURANT_S_COMPLETION,
		RESTAURANT_UPGRADE_LV, RESTAURANT_S_BUILDING_OR_UPGRADING, utils.UnixtimeMilli())
	return err
}

func AddRestaurantCached(tx *sqlx.Tx, id int, currency int, val float64) (int, error) {
	var column string
	switch currency {
	case Constants.Player.Diamond:
		column = "cached_diamond"
	case Constants.Player.Energy:
		column = "cached_energy"
	case Constants.Player.Gold:
		column = "cached_gold"
	}
	if column == "" {
		Logger.Debug("AddRestaurantCached Error Currency",
			zap.Int("currency", currency), zap.Any("val", val))
		return Constants.RetCode.MysqlError, errors.New("error currency")
	}

	now := utils.UnixtimeMilli()
	query, args, err := sq.Update("player_restaurant_binding").
		Set(column, sq.Expr(column+"+?", val)).Set("updated_at", now).
		Where(sq.Eq{"id": id, "deleted_at": nil}).ToSql()

	Logger.Debug("AddRestaurantCached", zap.String("sql", query), zap.Any("args", args))
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
	Logger.Debug("AddRestaurantCached", zap.Int64("rowsAffected", rowsAffected),
		zap.Bool("add", ok))
	if !ok {
		return Constants.RetCode.UnknownError, nil
	}
	return 0, nil
}

func CostRestaurantCached(tx *sqlx.Tx, id int, currency int, val int) (int, error) {
	var column string
	switch currency {
	case Constants.Player.Diamond:
		column = "cached_diamond"
	case Constants.Player.Energy:
		column = "cached_energy"
	case Constants.Player.Gold:
		column = "cached_gold"
	}
	if column == "" {
		Logger.Debug("ConstRestaurantCached Error Currency",
			zap.Int("currency", currency), zap.Int("val", val))
		return Constants.RetCode.MysqlError, errors.New("error currency")
	}

	now := utils.UnixtimeMilli()
	query, args, err := sq.Update("player_restaurant_binding").
		Set(column, sq.Expr(column+"-?", val)).Set("updated_at", now).
		Where(sq.Eq{"id": id, "deleted_at": nil}).ToSql()

	Logger.Debug("CostRestaurantCached", zap.String("sql", query), zap.Any("args", args))
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
	Logger.Debug("CostRestaurantCached", zap.Int64("rowsAffected", rowsAffected),
		zap.Bool("add", ok))
	if !ok {
		return Constants.RetCode.UnknownError, nil
	}
	return 0, nil
}

type Rows interface {
}

func GenGuest() (*sql.Rows, error) {
	canWorkingStates := []int{RESTAURANT_S_COMPLETION, RESTAURANT_S_CANCELLATION}
	//query, args, err := sq.Select("restaurant_id, id, player_id, current_level").From("player_restaurant_binding").Where(sq.Eq{"state": canWorkingStates}).ToSql()
	//if err != nil {
	//	return nil, err
	//}
	query, args, err := sq.Select("t1.restaurant_id, t1.id, t1.player_id, t1.current_level").From("player_restaurant_binding as t1 join player_restaurant_cook_binding as t2 on t1.restaurant_id=t2.restaurant_id and t1.player_id=t2.player_id").Where(sq.Eq{"t1.state": canWorkingStates, "t1.deleted_at": nil, "t2.deleted_at": nil}).ToSql()
	if err != nil {
		return nil, err
	}
	//query := "select t1.restaurant_id, t1.id, t1.player_id, t1.current_level `player_restaurant_binding` as t1 join player_restaurant_cook_binding as t2 " +
	//	"on t1.restaurant_id=t2.restaurant_id and t1.cook_id=t2.cook_id and t1.player_id=t2.player_id " +
	//	"where t1.state=? "
	Logger.Debug("genguest", zap.String("sql", query), zap.Any("args", args))

	rows, err := storage.MySQLManagerIns.Query(query, args...)
	if err != nil {
		return nil, err
	}
	return rows, nil
}

func UpdatePlayerRestaurantState(tx *sqlx.Tx, playerId int, restaurantId int, state int) (int, error) {
	if state != RESTAURANT_ON_WORK && state != RESTAURANT_OFF_WORK {
		return Constants.RetCode.InvalidRequestParam, errors.New("error playerRestaurant state")
	}
	query, args, err := sq.Update("player_restaurant_binding").
		Set("work_state", state).
		Where(sq.Eq{"player_id": playerId, "restaurant_id": restaurantId}).ToSql()
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

func UpdateLastGuestGenAt(id int, t int64) (int, error) {
	query, args, err1 := sq.Update("player_restaurant_binding").
		Set("last_guest_gen_at", t).
		Where(sq.Eq{"id": id}).ToSql()
	if err1 != nil {
		return Constants.RetCode.MysqlError, err1
	}
	Logger.Debug("UpdateLastGuestGenAt", zap.String("sql", query), zap.Any("args", args))
	_, err := storage.MySQLManagerIns.Exec(query, args...)
	if err == sql.ErrNoRows {
		return 0, nil
	}
	if err != nil {
		return Constants.RetCode.MysqlError, err
	}
	return 0, nil
}

func EnsuredPlayerRestaurantBinding(playerId int, restaurantId int) (bool, error) {
	return exist("player_restaurant_binding", sq.Eq{"player_id": playerId, "restaurant_id": restaurantId, "deleted_at": nil})
}
func EnsuredPlayerRestaurantCanWork(playerId int, restaurantId int) (bool, error) {
	canWorkStates := []int{RESTAURANT_S_COMPLETION, RESTAURANT_S_CANCELLATION}
	return exist("player_restaurant_binding", sq.Eq{"player_id": playerId, "restaurant_id": restaurantId, "state": canWorkStates, "deleted_at": nil})
}
