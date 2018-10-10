package models

import (
	"errors"
	"go.uber.org/zap"
	. "server/common"
	"server/common/utils"
	"server/storage"

	"database/sql"
	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type PlayerCookBinding struct {
	GetOrUpgradingStartedAt NullInt64 `json:"getOrUpgradingStartedAt" db:"get_or_upgrading_started_at"`
	ID                      int       `json:"id" db:"id"`
	PlayerID                int       `json:"playerId" db:"player_id"`
	CookID                  int       `json:"cookId" db:"cook_id"`
	State                   int       `json:"state" db:"state"`
	GoldAddition            int       `json:"goldAddition" db:"gold_addition"`
	EnergyAddition          int       `json:"energyAddition" db:"energy_addition"`
	StartedWorkAt           NullInt64 `json:"startedWorkAt" db:"started_work_at"`
	WorkingTime             int       `json:"workingTime" db:"working_time"`
	CreatedAt               int64     `json:"-" db:"created_at"`
	UpdatedAt               int64     `json:"-" db:"updated_at"`
	DeletedAt               NullInt64 `json:"-" db:"deleted_at"`
}

const (
	COOK_OFF_UPGRAD_ON_WORK  = 0
	COOK_OFF_UPGRAD_OFF_WORK = 1
	COOK_ON_UPGRAD_ON_WORK   = 2
	COOK_ON_UPGRAD_OFF_WORK  = 3
)

func NewPlayerCookBinding(playerId int, cookId int, goldAddition int, energyAddition int, workingTime int) *PlayerCookBinding {
	now := utils.UnixtimeMilli()
	v := &PlayerCookBinding{
		GetOrUpgradingStartedAt: NewNullInt64(now),
		StartedWorkAt:           NewNullInt64(now),
		PlayerID:                playerId,
		CookID:                  cookId,
		State:                   COOK_OFF_UPGRAD_OFF_WORK,
		GoldAddition:            goldAddition,
		EnergyAddition:          energyAddition,
		WorkingTime:             workingTime,
		CreatedAt:               now,
		UpdatedAt:               now,
	}
	return v
}

func (p *PlayerCookBinding) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "player_cook_binding", []string{"started_work_at, get_or_upgrading_started_at, player_id, cook_id, state, gold_addition, energy_addition, working_time, updated_at, created_at"}, []interface{}{p.StartedWorkAt, p.GetOrUpgradingStartedAt, p.PlayerID, p.CookID, p.State, p.GoldAddition, p.EnergyAddition, p.WorkingTime, p.UpdatedAt, p.CreatedAt})
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
func UpdatePlayerCookStateAndStatWorkTime(tx *sqlx.Tx, playerId int, cookId int, state int, startedWorkAt int64) (int, error) {
	if state != COOK_ON_UPGRAD_ON_WORK && state != COOK_OFF_UPGRAD_ON_WORK && state != COOK_ON_UPGRAD_OFF_WORK && state != COOK_OFF_UPGRAD_OFF_WORK {
		return Constants.RetCode.InvalidRequestParam, errors.New("error playerCook state")
	}
	query, args, err := sq.Update("player_cook_binding").
		Set("state", state).
		Set("started_work_at", startedWorkAt).
		Where(sq.Eq{"player_id": playerId, "cook_id": cookId}).ToSql()
	Logger.Debug("UpdatePlayerCookStateAndStatWorkTime", zap.String("sql", query), zap.Any("args", args))
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

func UpdatePlayerCookStatWorkTime(tx *sqlx.Tx, playerId int, cookId int, startedWorkAt int64) (int, error) {
	query, args, err := sq.Update("player_cook_binding").
		Set("started_work_at", startedWorkAt).
		Where(sq.Eq{"player_id": playerId, "cook_id": cookId}).ToSql()
	if err != nil {
		return Constants.RetCode.MysqlError, err
	}
	Logger.Debug("UpdatePlayerCookStatWorkTime", zap.String("sql", query), zap.Any("args", args))
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

func GetPlayerCookBindingByPlayerIdAndCookId(playerId int, cookId int) (*PlayerCookBinding, error) {
	var tmp PlayerCookBinding
	err := getObj("player_cook_binding", sq.Eq{"player_id": playerId, "cook_id": cookId, "deleted_at": nil}, &tmp)
	if err == sql.ErrNoRows {
		return nil, nil
	}
	return &tmp, nil
}

func GetPlayerCookListByPlayerId(playerId int) ([]*PlayerCookBinding, error) {
	var ls []*PlayerCookBinding
	err := getList("player_cook_binding", sq.Eq{"player_id": playerId, "deleted_at": nil}, &ls)
	if err != nil {
		return nil, err
	}
	return ls, nil
}
func EnsuredPlayerGetedCookById(playerId int, cookId int) (bool, error) {
	return exist("player_cook_binding", sq.Eq{"player_id": playerId, "cook_id": cookId, "deleted_at": nil})
}

func WorkingCooks() (*sql.Rows, error) {
	workStates := []int{COOK_ON_UPGRAD_ON_WORK, COOK_OFF_UPGRAD_ON_WORK}
	//now := utils.UnixtimeMilli()

	query, args, err := sq.Select("started_work_at, working_time, cook_id, player_id").
		From("player_cook_binding").
		Where(sq.Eq{"state": workStates}).
		Where(sq.Eq{"deleted_at": nil}).
		//Where(sq.LtOrEq{"working_time + started_work_at": now}).
		ToSql()

	Logger.Debug("get workingCooks", zap.String("sql", query), zap.Any("args", args))
	if err != nil {
		return nil, err
	}
	rows, err := storage.MySQLManagerIns.Query(query, args...)
	if err != nil {
		return nil, err
	}
	return rows, nil
}
