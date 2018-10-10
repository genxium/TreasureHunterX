package ws

import (
	"errors"
	"reflect"
	. "server/common"
	"server/common/utils"
	"server/models"
	"server/storage"

	"github.com/jmoiron/sqlx"
	"go.uber.org/zap"
)

func init() {
	regHandleInfo("PlayerGetCooks",
		&wsHandleInfo{reflect.TypeOf(playerGetCooksReq{}),
			"PlayerGetCooksResp"})
	regHandleInfo("QueryGameCookList",
		&wsHandleInfo{reflect.TypeOf(queryGameCookListReq{}),
			"QueryGameCookListResp"})
	regHandleInfo("QueryPlayerCookList",
		&wsHandleInfo{reflect.TypeOf(getPlayerCookListReq{}),
			"QueryPlayerCookListResp"})
	regHandleInfo("CookBindingToRestaurant",
		&wsHandleInfo{reflect.TypeOf(CookBindingToRestaurantReq{}),
			"CookBindingToRestaurantResp"})
	regHandleInfo("CookUnBindingFromRestaurant",
		&wsHandleInfo{reflect.TypeOf(CookUnBindingFromRestaurantReq{}),
			"CookUnBindingFromRestaurantResp"})
	regHandleInfo("GetPlayerRestaurantCook",
		&wsHandleInfo{reflect.TypeOf(getPlayerRestaurantCookReq{}),
			"GetPlayerRestaurantCookResp"})
	regHandleInfo("PlayerCookStartWork",
		&wsHandleInfo{reflect.TypeOf(playerCookStartWorkReq{}),
			"PlayerCookStartWorkResp"})
	regHandleInfo("UpgradeCook",
		&wsHandleInfo{reflect.TypeOf(upgradeCookReq{}),
			"UpgradeCookResp"})
}

type upgradeCookReq struct {
	PlayerId          int `json:"playerId"`
	CookId            int `json:"cookId"`
	CookUpgradeDataId int `json:"cookUpgradeDataId"`
}

func (req *upgradeCookReq) handle(session *Session, resp *wsResp) error {
	//data := &struct {
	//	*upgradeCookReq
	//}{req}
	//upgradeCookData, err := models.GetCookUpgradeData(req.CookUpgradeDataId)
	return nil
}

const (
	COOK_INIT_LV = 0
)

type queryGameCookListReq struct{}

type cookListRes struct {
	CookInfo            *models.Cook              `json:"cookInfo"`
	CookFoodBindingList []*models.CookFoodBinding `json:"cookFoodBindingList"`
}

func (req *queryGameCookListReq) handle(session *Session, resp *wsResp) error {
	data := &struct {
		*queryGameCookListReq
		CookList []*cookListRes
	}{req, nil}
	cookList, err := models.GetCookList()
	if err != nil {
		resp.Ret = Constants.RetCode.Ok
		return err
	}
	if cookList == nil {
		Logger.Info("get cookList error")
	}
	data.CookList = make([]*cookListRes, len(cookList))
	for i, v := range cookList {
		var cookFoodList []*models.CookFoodBinding
		if v.NumFood > 0 {
			cookFoodList = make([]*models.CookFoodBinding, v.NumFood)
			cookFoodList, err = models.GetCookFoodBindingList(v.ID)
			if err != nil {
				resp.Ret = Constants.RetCode.MysqlError
				return err
			}
			if cookFoodList == nil {
				Logger.Info("get cookFoodList error")
			}
		}
		tmp := &cookListRes{
			CookInfo:            v,
			CookFoodBindingList: cookFoodList,
		}
		data.CookList[i] = tmp
	}
	resp.Data = data
	resp.Ret = Constants.RetCode.Ok
	return nil
}

type playerCookStartWorkReq struct {
	PlayerId     int `json:"playerId"`
	RestaurantId int `json:"restaurantId"`
	CookId       int `json:"cookId"`
}

func (req *playerCookStartWorkReq) handle(session *Session, resp *wsResp) error {
	data := &struct {
		*playerCookStartWorkReq
	}{req}
	resp.Data = data
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	ret, err := cookOnWork(tx, req.PlayerId, req.RestaurantId, req.CookId)
	if err != nil || ret != 0 {
		resp.Ret = ret
		return err
	}
	txerr := tx.Commit()
	if txerr != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return txerr
	}
	resp.Ret = Constants.RetCode.Ok
	return nil
}

type playerGetCooksReq struct {
	RestaurantId int `json:"restaurantId"`
}

func (req *playerGetCooksReq) handle(session *Session, resp *wsResp) error {
	//binding player cook
	playerId := session.id
	//get ids []int
	ids := getCookIds(playerId)
	if ids == nil {
		resp.Ret = Constants.RetCode.MysqlError
		return nil
	}
	cooks, err := models.GetCookListByIds(ids)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	data := &struct {
		*playerGetCooksReq
		CookList []*CookResp `json:"cookList"`
	}{req, nil}
	resp.Data = data
	data.CookList = make([]*CookResp, len(ids))
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	for i, v := range cooks {
		exist, err := models.EnsuredPlayerGetedCookById(playerId, v.ID)
		if err != nil {
			resp.Ret = Constants.RetCode.MysqlError
			return err
		}
		if err == nil && exist {
			//检查该厨师是否已经被该用户抽取过
			resp.Ret = Constants.RetCode.CookAlreadyGeted
			return err
		}
		if err == nil && !exist {
			playerCookBinding := models.NewPlayerCookBinding(playerId, v.ID, v.GoldAddition, v.EnergyAddition, v.WorkingTime)
			err := playerCookBinding.Insert(tx)
			if err != nil {
				resp.Ret = Constants.RetCode.MysqlError
				return err
			}
			var cookFoodList []*models.CookFoodBinding
			if v.NumFood > 0 {
				cookFoodList = make([]*models.CookFoodBinding, v.NumFood)
				cookFoodList, err = models.GetCookFoodBindingList(v.ID)
				if err != nil {
					resp.Ret = Constants.RetCode.MysqlError
					return err
				}
				if cookFoodList == nil {
					Logger.Info("get cookFoodList error")
				}
			}
			tmp := &CookResp{
				PlayerCookBinding:   playerCookBinding,
				CookInfo:            v,
				CookFoodBindingList: cookFoodList,
			}
			data.CookList[i] = tmp
		}
	}
	txerr := tx.Commit()
	if txerr != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return txerr
	}
	resp.Ret = Constants.RetCode.Ok
	return nil
}

type getPlayerCookListReq struct {
	RestaurantId int `json:"restaurantId"`
}

type CookResp struct {
	CookInfo                    *models.Cook                        `json:"cookInfo"`
	PlayerCookBinding           *models.PlayerCookBinding           `json:"playerCookBinding"`
	PlayerRestaurantCookBinding *models.PlayerRestaurantCookBinding `json:"playerRestaurantCookBinding"`
	CookFoodBindingList         []*models.CookFoodBinding           `json:"cookFoodBindingList"`
}

func (req *getPlayerCookListReq) handle(session *Session, resp *wsResp) error {
	data := &struct {
		*getPlayerCookListReq
		CookList []*CookResp `json:"cookList"`
	}{req, nil}
	resp.Data = data

	playerId := session.id

	playerCookList, err := models.GetPlayerCookListByPlayerId(playerId)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	data.CookList = make([]*CookResp, len(playerCookList))
	for i, v := range playerCookList {
		cook, err := models.GetCookById(v.CookID)
		if err != nil {
			resp.Ret = Constants.RetCode.MysqlError
			return err
		}
		playerRestaurantCookBinding, err := models.GetPlayerRestaurantCookBindingByPlayerIdAndCookId(playerId, v.CookID)
		if err != nil {
			resp.Ret = Constants.RetCode.MysqlError
			return err
		}
		Logger.Info("playerRestaurantCookBinding", zap.Any("data:", playerRestaurantCookBinding))
		var cookFoodList []*models.CookFoodBinding
		if cook.NumFood > 0 {
			cookFoodList = make([]*models.CookFoodBinding, cook.NumFood)
			cookFoodList, err = models.GetCookFoodBindingList(cook.ID)
			if err != nil {
				resp.Ret = Constants.RetCode.MysqlError
				return err
			}
			if cookFoodList == nil {
				Logger.Info("get cookFoodList error")
			}
		}
		tmp := &CookResp{
			PlayerCookBinding:           v,
			CookInfo:                    cook,
			PlayerRestaurantCookBinding: playerRestaurantCookBinding,
			CookFoodBindingList:         cookFoodList,
		}
		data.CookList[i] = tmp
	}
	resp.Ret = Constants.RetCode.Ok
	return nil
}

type getPlayerRestaurantCookReq struct {
	PlayerId     int `json:"playerId"`
	RestaurantId int `json:"restaurantId"`
}

func (req *getPlayerRestaurantCookReq) handle(session *Session, resp *wsResp) error {
	type cookFoodBindingList struct {
		CookFoodBinding *models.CookFoodBinding `json:"cookFoodBinding"`
		Food            *models.Food            `json:"food"`
	}
	data := &struct {
		*getPlayerRestaurantCookReq
		CookInfo                    *models.Cook                        `json:"cookInfo"`
		PlayerCookBinding           *models.PlayerCookBinding           `json:"playerCookBinding"`
		PlayerRestaurantCookBinding *models.PlayerRestaurantCookBinding `json:"playerRestaurantCookBinding"`
		CookFoodBindingList         []*cookFoodBindingList              `json:"cookFoodBindingList"`
	}{req, nil, nil, nil, nil}
	resp.Data = data

	playerId := session.id

	playerRestaurantCookBinding, err := models.GetPlayerRestaurantCookBindingByPlayerIdAndRestaurantId(playerId, req.RestaurantId)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	if playerRestaurantCookBinding == nil {
		Logger.Info("playerRestaurantCookBinding not exist")
		resp.Ret = Constants.RetCode.Ok
		return nil
	}
	Logger.Info("playerRestaurantCookBinding exist", zap.Any("prcb :", playerRestaurantCookBinding))
	cook, err := models.GetCookById(playerRestaurantCookBinding.CookID)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	playerCookBinding, err := models.GetPlayerCookBindingByPlayerIdAndCookId(playerRestaurantCookBinding.PlayerID, playerRestaurantCookBinding.CookID)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	var cookFoodList []*cookFoodBindingList
	if cook.NumFood > 0 {
		cookFoodList = make([]*cookFoodBindingList, cook.NumFood)
		cookFoodBinding, err := models.GetCookFoodBindingList(cook.ID)
		if err != nil {
			resp.Ret = Constants.RetCode.MysqlError
			return err
		}
		if cookFoodBinding == nil {
			Logger.Info("get cookFoodList error")
		}
		for i, v := range cookFoodBinding {
			food, err := models.GetFoodById(v.FoodID)
			if err != nil {
				resp.Ret = Constants.RetCode.MysqlError
				return err
			}
			cookFoodList[i] = &cookFoodBindingList{
				CookFoodBinding: v,
				Food:            food,
			}
		}
	}
	data.PlayerRestaurantCookBinding = playerRestaurantCookBinding
	data.CookInfo = cook
	data.CookFoodBindingList = cookFoodList
	data.PlayerCookBinding = playerCookBinding
	resp.Ret = Constants.RetCode.Ok
	return nil
}

type CookBindingToRestaurantReq struct {
	PlayerId     int `json:"playerId"`
	RestaurantId int `json:"restaurantId"`
	CookId       int `json:"cookId"`
}

func (req *CookBindingToRestaurantReq) handle(session *Session, resp *wsResp) error {
	data := &struct {
		*CookBindingToRestaurantReq
	}{req}
	resp.Data = data
	var exist bool
	var err error
	var ret int
	exist, err = models.EnsuredPlayerRestaurantBinding(req.PlayerId, req.RestaurantId)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	if err == nil && !exist {
		Logger.Info("playerRestaurant not exist", zap.Int("playerId:", req.PlayerId), zap.Int("restaurantId:", req.RestaurantId))
		resp.Ret = Constants.RetCode.InvalidRequestParam
		return err
	}
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	//进行绑定
	ret, err = playerCookBindingToRestaurant(tx, req.PlayerId, req.RestaurantId, req.CookId)
	if err != nil {
		resp.Ret = ret
		return err
	}
	//让厨师上班
	ret, err = cookOnWork(tx, req.PlayerId, req.RestaurantId, req.CookId)
	if err != nil {
		resp.Ret = ret
		return err
	}
	txerr := tx.Commit()
	if txerr != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return txerr
	}
	resp.Ret = Constants.RetCode.Ok
	return nil
}

type CookUnBindingFromRestaurantReq struct {
	PlayerId     int `json:"playerId"`
	RestaurantId int `json:"restaurantId"`
	CookId       int `json:"cookId"`
}

func (req *CookUnBindingFromRestaurantReq) handle(session *Session, resp *wsResp) error {
	data := &struct {
		*CookUnBindingFromRestaurantReq
	}{req}
	resp.Data = data
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	exist, err := models.EnsuredPlayerRestaurantCookBinding(req.PlayerId, req.CookId)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	if err == nil && exist {
		var err error
		var ret int
		//进行解除厨师餐厅绑定
		ret, err = playerCookUnBindingFromRestaurant(tx, req.PlayerId, req.RestaurantId, req.CookId)
		if err != nil {
			resp.Ret = ret
			return err
		}
		//让厨师下班
		ret, err = cookOffWork(tx, req.PlayerId, req.RestaurantId, req.CookId)
		if err != nil {
			resp.Ret = ret
			return err
		}
	}
	txerr := tx.Commit()
	if txerr != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return txerr
	}
	resp.Ret = Constants.RetCode.Ok
	return nil
}

func HandleCookWork() {
	var (
		cook_id         int
		player_id       int
		working_time    int
		started_work_at int
	)
	Logger.Debug("HandleCookWork")
	rows, err := models.WorkingCooks()
	defer rows.Close()
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	for rows.Next() {
		err := rows.Scan(&cook_id, &player_id)
		if err != nil {
			Logger.Debug("HandleCookWork", zap.Any("mysql error", err))
		}
		playerRestaurantCookBinding, err := models.GetPlayerRestaurantCookBindingByPlayerIdAndCookId(player_id, cook_id)
		if err != nil && playerRestaurantCookBinding == nil {
			if err != nil {
				Logger.Debug("HandleCookWork", zap.Any("mysql error", err))
			} else {
				Logger.Debug("palyer_restaurant_binding not exist", zap.Any("player_id", player_id), zap.Any("cook_id", cook_id))
			}
		} else {
			playerRestaurantBinding, err := models.GetPlayerRestaurantBindingByPlayerIdAndRestaurantId(player_id, playerRestaurantCookBinding.RestaurantID)
			if err != nil {
				Logger.Debug("HandleCookWork", zap.Any("mysql error", err))
			}
			lvConf, err := models.GetRestaurantLevelBinding(playerRestaurantBinding.RestaurantID, playerRestaurantBinding.CurrentLevel)
			if err != nil {
				Logger.Debug("HandleCookWork", zap.Any("mysql error", err))
			}
			now := utils.UnixtimeMilli()
			if int64(lvConf.BusinessTime*(1+working_time/100)+started_work_at) < now {
				_, err := cookOffWork(tx, player_id, playerRestaurantCookBinding.RestaurantID, cook_id)
				if err != nil {
					Logger.Debug("HandleCookWork", zap.Any("mysql error", err))
				}
			}
		}
	}
	err = tx.Commit()
	if err != nil {
		Logger.Debug("HandleCookWork", zap.Any("mysql error", err))
	}
	err = rows.Err()
	if err != nil {
		Logger.Debug("HandleCookWork", zap.Any("mysql rows", err))
	}
	if err != nil {
		Logger.Debug("HandleCookWork", zap.Error(err))
	}
}

//内部私有函数
func getCookIds(playerId int) []int {
	playerCooks, err := models.GetPlayerCookListByPlayerId(playerId)
	if err != nil {
		Logger.Info("get cook ids", zap.Error(err))
		return nil
	}
	//if playerCooks == nil {
	//	return [] int {0}
	//}
	return []int{len(playerCooks) + 1}
}

func cookOnWork(tx *sqlx.Tx, playerId int, restaurantId int, cookId int) (int, error) {
	playerCook, err := models.GetPlayerCookBindingByPlayerIdAndCookId(playerId, cookId)
	if err != nil {
		return Constants.RetCode.MysqlError, err
	}
	if err == nil && playerCook == nil {
		Logger.Info("playerCook not exist", zap.Int("playerId:", playerId), zap.Int("cookId:", cookId))
		return Constants.RetCode.InvalidRequestParam, errors.New("error playerCook info")
	}
	now := utils.UnixtimeMilli()
	var updateErr error
	var ret int
	if playerCook.State == models.COOK_ON_UPGRAD_OFF_WORK {
		ret, updateErr = models.UpdatePlayerCookStateAndStatWorkTime(tx, playerId, cookId, models.COOK_ON_UPGRAD_ON_WORK, now)
	}
	if playerCook.State == models.COOK_OFF_UPGRAD_OFF_WORK {
		ret, updateErr = models.UpdatePlayerCookStateAndStatWorkTime(tx, playerId, cookId, models.COOK_OFF_UPGRAD_ON_WORK, now)
	}
	if playerCook.State == models.COOK_OFF_UPGRAD_ON_WORK || playerCook.State == models.COOK_ON_UPGRAD_ON_WORK {
		ret, updateErr = models.UpdatePlayerCookStatWorkTime(tx, playerId, cookId, now)
	}
	if updateErr != nil {
		return ret, updateErr
	}
	ret, updateErr = restaurantOnWork(tx, playerId, restaurantId)
	if updateErr != nil {
		return ret, updateErr
	}
	return 0, nil
}

func cookOffWork(tx *sqlx.Tx, playerId int, restaurantId int, cookId int) (int, error) {
	playerCook, err := models.GetPlayerCookBindingByPlayerIdAndCookId(playerId, cookId)
	if err != nil {
		return Constants.RetCode.MysqlError, err
	}
	if err == nil && playerCook == nil {
		Logger.Info("playerCook not exist", zap.Int("playerId:", playerId), zap.Int("cookId:", cookId))
		return Constants.RetCode.InvalidRequestParam, errors.New("error playerCook info")
	}
	now := utils.UnixtimeMilli()
	var updateErr error
	var ret int
	if playerCook.State == models.COOK_ON_UPGRAD_ON_WORK {
		ret, updateErr = models.UpdatePlayerCookStateAndStatWorkTime(tx, playerId, cookId, models.COOK_ON_UPGRAD_OFF_WORK, now)
	}
	if playerCook.State == models.COOK_OFF_UPGRAD_ON_WORK {
		ret, updateErr = models.UpdatePlayerCookStateAndStatWorkTime(tx, playerId, cookId, models.COOK_OFF_UPGRAD_OFF_WORK, now)
	}
	if updateErr != nil {
		return ret, updateErr
	}
	ret, updateErr = restaurantOffWork(tx, playerId, restaurantId)
	if updateErr != nil {
		return ret, updateErr
	}
	return 0, nil
}

const (
	RESTAURANT_CAN_NOT_WORK                  = 3000
	PLAYER_RESTAURANT_COOK_BINDING_NOT_EXIST = 3001
)

func restaurantOnWork(tx *sqlx.Tx, playerId int, restaurantId int) (int, error) {
	canWork, err := models.EnsuredPlayerRestaurantCanWork(playerId, restaurantId)
	if err != nil {
		return Constants.RetCode.MysqlError, err
	}
	if !canWork {
		Logger.Info("restaurant can not work", zap.Int("playerId:", playerId), zap.Int("restaurantId:", restaurantId))
		ret, err := restaurantOffWork(tx, playerId, restaurantId)
		if err != nil {
			return ret, err
		}
		return RESTAURANT_CAN_NOT_WORK, nil
	}
	ret, err := models.UpdatePlayerRestaurantState(tx, playerId, restaurantId, models.RESTAURANT_ON_WORK)
	if err != nil {
		return ret, err
	}
	return 0, nil
}

func restaurantOffWork(tx *sqlx.Tx, playerId int, restaurantId int) (int, error) {
	ret, err := models.UpdatePlayerRestaurantState(tx, playerId, restaurantId, models.RESTAURANT_OFF_WORK)
	if err != nil {
		return ret, err
	}
	return 0, nil
}

func playerCookUnBindingFromRestaurant(tx *sqlx.Tx, playerId int, restaurantId int, cookId int) (int, error) {
	ret, err := models.PlayerRestaurantCookUnBinding(tx, playerId, restaurantId, cookId)
	if err != nil {
		return ret, err
	}
	return 0, nil
}
func playerCookBindingToRestaurant(tx *sqlx.Tx, playerId int, restaurantId int, cookId int) (int, error) {
	exist, err := models.EnsuredPlayerRestaurantCookBinding(playerId, cookId)
	if err != nil {
		return Constants.RetCode.MysqlError, err
	}
	if err == nil && exist {
		_, err := playerCookUnBindingFromRestaurant(tx, playerId, restaurantId, cookId)
		if err != nil {
			return Constants.RetCode.MysqlError, err
		}
	}
	playerRestaurantCookBinding := models.NewPlayerRestaurantCookBinding(playerId, cookId, restaurantId)
	err1 := playerRestaurantCookBinding.Insert(tx)
	if err1 != nil {
		return Constants.RetCode.MysqlError, err1
	}
	return 0, nil
}
