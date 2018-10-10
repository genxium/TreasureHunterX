package ws

import (
	"errors"
	"go.uber.org/zap"
	"reflect"
	. "server/common"
	"server/common/utils"
	"server/models"
	"server/storage"
)

type startRestaurantBuildingReq struct {
	RestaurantId int `json:"restaurantId"`
}

const (
	RESTAURANT_INIT_LV = 0
)

func init() {
	regHandleInfo("StartRestaurantBuilding",
		&wsHandleInfo{reflect.TypeOf(startRestaurantBuildingReq{}),
			"StartRestaurantBuildingResp"})
	regHandleInfo("StartRestaurantUpgrading",
		&wsHandleInfo{reflect.TypeOf(startRestaurantUpgradingReq{}),
			"StartRestaurantUpgradingResp"})
	regHandleInfo("QueryRestaurantsInMap",
		&wsHandleInfo{reflect.TypeOf(queryRestaurantsInGeomapReq{}),
			"QueryRestaurantsInMapResp"})
	regHandleInfo("CancelRestaurantBuildingOrUpgrading",
		&wsHandleInfo{reflect.TypeOf(cancelRestaurantBuildingOrUpgrading{}),
			"CancelRestaurantBuildingOrUpgradingResp"})
	regHandleInfo("CollectCashier",
		&wsHandleInfo{reflect.TypeOf(collectCashierReq{}),
			"CollectCashierResp"})
	regHandleInfo("PlayerRestaurantResearch",
		&wsHandleInfo{reflect.TypeOf(playerRestaurantResearchReq{}),
			"PlayerRestaurantResearchResp"})
	regHandleInfo("QueryPlayerRestaurantBusinessTime",
		&wsHandleInfo{reflect.TypeOf(queryPlayerRestaurantBusinessTimeReq{}),
			"QueryPlayerRestaurantBusinessTimeResp"})
}

type queryPlayerRestaurantBusinessTimeReq struct {
	PlayerId     int `json:"playerId"`
	RestaurantId int `json:"restaurantId"`
	CookId       int `json:"cookId"`
}

func (req *queryPlayerRestaurantBusinessTimeReq) handle(session *Session, resp *wsResp) error {
	data := &struct {
		*queryPlayerRestaurantBusinessTimeReq
		StartTime    models.NullInt64 `json:"startTime"`
		BusinessTime int              `json:"businessTime"`
	}{req, models.NewNullInt64(int64(0)), 0}
	resp.Data = data
	//查询player_restaurant_binidng
	playerRestaurantBinding, err := models.GetPlayerRestaurantBindingList(req.PlayerId, []int{req.RestaurantId})
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	if playerRestaurantBinding == nil {
		resp.Ret = Constants.RetCode.InvalidRequestParam
		return errors.New("playerRestaurantBinding not exist")
	}
	//查询restaurant_level_binding
	restaurantLevelConf, err := models.GetRestaurantLevelBinding(req.RestaurantId, playerRestaurantBinding[0].CurrentLevel)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	if restaurantLevelConf == nil {
		resp.Ret = Constants.RetCode.InvalidRequestParam
		return errors.New("restaurantLevel not exist")
	}
	//查询player_cook_binding
	playerCookBinding, err := models.GetPlayerCookBindingByPlayerIdAndCookId(req.PlayerId, req.CookId)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	if playerCookBinding == nil {
		resp.Ret = Constants.RetCode.InvalidRequestParam
		return errors.New("playerCookBinding not exist")
	}
	data.StartTime = playerCookBinding.StartedWorkAt
	data.BusinessTime = (100 + playerCookBinding.WorkingTime) * restaurantLevelConf.BusinessTime / 100
	resp.Ret = Constants.RetCode.Ok
	return nil
}

const (
	RESTAURANT_FOOD_BINDING_FIRST_GET_ORDER = 1
)

type playerRestaurantResearchReq struct {
	PlayerId     int `json:"playerId"`
	RestaurantId int `json:"restaurantId"`
}

func (req *playerRestaurantResearchReq) handle(session *Session, resp *wsResp) error {
	data := &struct {
		*playerRestaurantResearchReq
	}{req}
	resp.Data = data
	playerRestaurantFoodBindingCount, err := models.GetPlayerRestaurantFoodBindingCount(session.id, req.RestaurantId)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	restaurantFoodBinding, err := models.GetRestaurantFoodBindingByGetOrderAndRestaurantID(RESTAURANT_FOOD_BINDING_FIRST_GET_ORDER+playerRestaurantFoodBindingCount, req.RestaurantId)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	if restaurantFoodBinding == nil {
		resp.Ret = Constants.RetCode.InvalidRequestParam
		return errors.New("不存在可研发菜品")
	}
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	ret, err := models.CostPlayerWallet(tx, session.id,
		restaurantFoodBinding.GetFoodCostCurrency, restaurantFoodBinding.GetFoodCostVal)
	if err != nil || ret != 0 {
		resp.Ret = ret
		return err
	}
	playerRestaurantFoodBinding := models.NewPlayerRestaurantFoodBinding(session.id, restaurantFoodBinding.FoodID, req.RestaurantId)
	err = playerRestaurantFoodBinding.Insert(tx)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	err = tx.Commit()
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	walletSync(session, session.id)
	resp.Ret = Constants.RetCode.Ok
	return nil
}

func (req *startRestaurantBuildingReq) handle(session *Session, resp *wsResp) error {

	data := &struct {
		RestaurantId              int              `json:"restaurantId"`
		PlayerRestaurantBindingId int              `json:"playerRestaurantBindingId"`
		StartedAt                 models.NullInt64 `json:"startedAt"`
		Duration                  int              `json:"duration"`
	}{req.RestaurantId, 0, models.NewNullInt64(0), 0}
	resp.Data = data

	playerId := session.id
	restaurantId := req.RestaurantId
	//TODO isRestaurantBuildable
	lvConf, err := models.GetRestaurantLevelBinding(restaurantId, RESTAURANT_INIT_LV)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	if lvConf == nil {
		resp.Ret = Constants.RetCode.InvalidRequestParam
		return errors.New("GetRestaurantLevelBinding Failed")
	}

	restaurantFoodBinding, err := models.GetRestaurantFoodBindingByGetOrderAndRestaurantID(RESTAURANT_FOOD_BINDING_FIRST_GET_ORDER, req.RestaurantId)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	if restaurantFoodBinding == nil {
		resp.Ret = Constants.RetCode.InvalidRequestParam
		return errors.New("不存在可研发菜品")
	}

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()

	playerRestaurantFoodBinding := models.NewPlayerRestaurantFoodBinding(session.id, restaurantFoodBinding.FoodID, req.RestaurantId)
	err = playerRestaurantFoodBinding.Insert(tx)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}

	ret, err := models.CostPlayerWallet(tx, playerId,
		lvConf.BuildingOrUpgradingCostCurrency, lvConf.BuildingOrUpgradingCostVal)
	if err != nil || ret != 0 {
		resp.Ret = ret
		return err
	}
	playerRestaurant := models.NewPlayerRestaurantBinding(playerId, restaurantId, RESTAURANT_INIT_LV)
	err = playerRestaurant.Insert(tx)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	if req.RestaurantId == 1 {
		updateResult, err := models.UpdatePlayerTutorialStage(tx, playerId)
		if err != nil {
			resp.Ret = Constants.RetCode.MysqlError
			return err
		}
		if updateResult == true {
			Logger.Debug("restaurant toturialstage update success")
		}
	}
	err = tx.Commit()
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	walletSync(session, playerId)

	data.PlayerRestaurantBindingId = playerRestaurant.ID
	data.StartedAt = playerRestaurant.BuildingOrUpgradingStartedAt
	data.Duration = lvConf.BuildingOrUpgradingDuration

	resp.Ret = Constants.RetCode.Ok
	return nil
}

type collectCashierReq struct {
	PlayerRestaurantBindingId int `json:"targetPlayerRestaurantBindingId"`
}

func (req *collectCashierReq) handle(session *Session, resp *wsResp) error {
	id := req.PlayerRestaurantBindingId
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	playerRestaurantBinding, err := models.GetPlayerRestaurantBinding(id)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	if playerRestaurantBinding == nil {
		resp.Ret = Constants.RetCode.InvalidRequestParam
		return err
	}
	costGoldRet, err := models.CostRestaurantCached(tx, id, Constants.Player.Gold, playerRestaurantBinding.CachedGold)
	if err != nil || costGoldRet != 0 {
		resp.Ret = costGoldRet
		return err
	}
	addGoldRet, err := models.AddPlayerWallet(tx, session.id, Constants.Player.Gold, playerRestaurantBinding.CachedGold)
	if err != nil || addGoldRet != 0 {
		resp.Ret = addGoldRet
		return err
	}
	costEnergyRet, err := models.CostRestaurantCached(tx, id, Constants.Player.Energy, playerRestaurantBinding.CachedEnergy)
	if err != nil || costEnergyRet != 0 {
		resp.Ret = costEnergyRet
		return err
	}
	addEnergyRet, err := models.AddPlayerWallet(tx, session.id, Constants.Player.Energy, playerRestaurantBinding.CachedEnergy)
	if err != nil || addEnergyRet != 0 {
		resp.Ret = addEnergyRet
		return err
	}
	err = tx.Commit()
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	walletSync(session, session.id)

	data := &struct {
		PlayerRestaurantBindingId int `json:"playerRestaurantBindingId"`
	}{id}
	resp.Ret = Constants.RetCode.Ok
	resp.Data = data
	return nil
}

type startRestaurantUpgradingReq struct {
	Id int `json:"playerRestaurantBindingId"`
}

func (req *startRestaurantUpgradingReq) handle(session *Session, resp *wsResp) error {
	id := req.Id
	data := &struct {
		RestaurantId              int              `json:"restaurantId"`
		PlayerRestaurantBindingId int              `json:"playerRestaurantBindingId"`
		StartedAt                 models.NullInt64 `json:"startedAt"`
		Duration                  int              `json:"duration"`
	}{0, id, models.NewNullInt64(0), 0}
	resp.Data = data
	playerId := session.id

	playerRestaurant, err := models.GetPlayerRestaurantBinding(id)
	if err != nil || playerRestaurant == nil {
		resp.Ret = Constants.RetCode.InvalidRequestParam
		return err
	}
	if playerRestaurant.State == models.RESTAURANT_S_BUILDING_OR_UPGRADING {
		resp.Ret = Constants.RetCode.InvalidRequestParam
		return err
	}
	lvConf, err := models.GetRestaurantLevelBinding(playerRestaurant.RestaurantID,
		playerRestaurant.CurrentLevel+1)

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	ret, err := models.CostPlayerWallet(tx, playerId,
		lvConf.BuildingOrUpgradingCostCurrency, lvConf.BuildingOrUpgradingCostVal)
	if err != nil || ret != 0 {
		resp.Ret = ret
		return err
	}
	now := utils.UnixtimeMilli()

	ok, err := models.StartRestaurantUpgrading(tx, id, now)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	if !ok {
		resp.Ret = Constants.RetCode.InvalidRequestParam
		return nil
	}
	err = tx.Commit()

	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	walletSync(session, playerId)

	data.RestaurantId = playerRestaurant.RestaurantID
	data.StartedAt = models.NewNullInt64(now)
	data.Duration = lvConf.BuildingOrUpgradingDuration

	resp.Ret = Constants.RetCode.Ok

	return nil
}

type queryRestaurantsInGeomapReq struct {
	GeomapId       int `json:"geomapId"`
	TargetPlayerId int `json:"targetPlayerId"`
}

type restaurantFoodBindingList struct {
	RestaurantFoodBinding *models.RestaurantFoodBinding `json:"restaurantFoodBinding"`
	Food                  *models.Food                  `json:"food"`
}

type restaurantResp struct {
	DisplayName                     string                                `json:"displayName"`
	ID                              int                                   `json:"id"`
	PlayerRestaurantBinding         *models.PlayerRestaurantBinding       `json:"playerRestaurantBinding"`
	LevelInfo                       *models.RestaurantLevelBinding        `json:"levelInfo"`
	CurrentLevelInfo                *models.RestaurantLevelBinding        `json:"currentLevelInfo"`
	RestaurantCookBinding           *models.PlayerRestaurantCookBinding   `json:"playerRestaurantCookBinding"`
	TopLevel                        int                                   `json:"topLevel"`
	Gold                            float64                               `json:"gold"`
	Energy                          float64                               `json:"energy"`
	RestaurantFoodBindingList       []*restaurantFoodBindingList          `json:"restaurantFoodBindingList"`
	PlayerRestaurantFoodBindingList []*models.PlayerRestaurantFoodBinding `json:"playerRestaurantFoodBingdingList"`
}

func (req *queryRestaurantsInGeomapReq) handle(session *Session, resp *wsResp) error {
	data := &struct {
		*queryRestaurantsInGeomapReq
		RestaurantList []*restaurantResp `json:"restaurantList"`
	}{req, nil}
	resp.Data = data

	if req.TargetPlayerId != session.id {
		resp.Ret = Constants.RetCode.MysqlError
		return nil
	}
	playerId := session.id

	restaurantConfs, err := models.GetAllRestaurantByMapId(req.GeomapId)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	restaurantIds := make([]int, len(restaurantConfs))
	for i, v := range restaurantConfs {
		restaurantIds[i] = v.ID
	}
	playerRestaurantBindingList, err := models.GetPlayerRestaurantBindingList(playerId, restaurantIds)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}

	playerRestaurantBindingDict := make(map[int]*models.PlayerRestaurantBinding)
	for _, playerRestaurantBinding := range playerRestaurantBindingList {
		playerRestaurantBindingDict[playerRestaurantBinding.RestaurantID] = playerRestaurantBinding
	}

	data.RestaurantList = make([]*restaurantResp, len(restaurantConfs))

	for i, restaurant := range restaurantConfs {
		lvConfs, err := models.GetRestaurantLevelBindingList([]int{restaurant.ID})
		if err != nil {
			resp.Ret = Constants.RetCode.MysqlError
			return err
		}
		topLevel := lvConfs[len(lvConfs)-1].Level
		lvConfsDict := make(map[int]*models.RestaurantLevelBinding)
		for _, restaurantLevel := range lvConfs {
			lvConfsDict[restaurantLevel.Level] = restaurantLevel
		}
		if playerRestaurantBindingDict[restaurant.ID] != nil {
			gold, energy, err := getEveryGuestGoldAndEnergyWhenCookIsWorking(playerId, restaurant.ID)
			if err != nil {
				resp.Ret = int(gold)
				return err
			}
			playerRestaurantFoodBindingList, err := models.GetPlayerRestaurantFoodBindingList(playerId, restaurant.ID)
			if err != nil {
				resp.Ret = Constants.RetCode.MysqlError
				return err
			}
			restaurantFoodBindings, err := models.GetRestaurantFoodBindingList(restaurant.ID)
			if err != nil {
				resp.Ret = Constants.RetCode.MysqlError
				return err
			}
			restaurantFoodBindingListTmp := make([]*restaurantFoodBindingList, 4)
			for i, v := range restaurantFoodBindings {
				food, err := models.GetFoodById(v.FoodID)
				if err != nil {
					resp.Ret = Constants.RetCode.MysqlError
					return err
				}
				restaurantFoodBindingListTmp[i] = &restaurantFoodBindingList{
					RestaurantFoodBinding: v,
					Food:                  food,
				}
			}
			playerRestaurantCookBinding, err := models.GetPlayerRestaurantCookBindingByPlayerIdAndRestaurantId(playerId, restaurant.ID)
			if err != nil {
				resp.Ret = Constants.RetCode.MysqlError
				return err
			}
			r := &restaurantResp{
				DisplayName:                     restaurant.DisplayName,
				ID:                              restaurant.ID,
				PlayerRestaurantBinding:         playerRestaurantBindingDict[restaurant.ID],
				LevelInfo:                       lvConfsDict[playerRestaurantBindingDict[restaurant.ID].CurrentLevel+1],
				CurrentLevelInfo:                lvConfsDict[playerRestaurantBindingDict[restaurant.ID].CurrentLevel],
				TopLevel:                        topLevel,
				Gold:                            gold,
				Energy:                          energy,
				PlayerRestaurantFoodBindingList: playerRestaurantFoodBindingList,
				RestaurantFoodBindingList:       restaurantFoodBindingListTmp,
				RestaurantCookBinding:           playerRestaurantCookBinding,
			}
			data.RestaurantList[i] = r
		} else {
			r := &restaurantResp{
				DisplayName:                     restaurant.DisplayName,
				ID:                              restaurant.ID,
				PlayerRestaurantBinding:         nil,
				LevelInfo:                       lvConfs[0],
				CurrentLevelInfo:                nil,
				TopLevel:                        topLevel,
				Gold:                            0,
				Energy:                          0,
				PlayerRestaurantFoodBindingList: nil,
				RestaurantFoodBindingList:       nil,
				RestaurantCookBinding:           nil,
			}
			data.RestaurantList[i] = r
		}
	}

	resp.Ret = Constants.RetCode.Ok
	return nil
}

type cancelRestaurantBuildingOrUpgrading struct {
	Id int `json:"playerRestaurantBindingId"`
}

func (req *cancelRestaurantBuildingOrUpgrading) handle(session *Session, resp *wsResp) error {
	now := utils.UnixtimeMilli()
	data := &struct {
		RestaurantId int   `json:"playerRestaurantBindingId"`
		CancelledAt  int64 `json:"cancelledAt"`
	}{req.Id, now}
	id := req.Id
	resp.Data = data
	playerId := session.id

	playerRestaurant, err := models.GetPlayerRestaurantBinding(id)
	if err != nil || playerRestaurant == nil {
		resp.Ret = Constants.RetCode.InvalidRequestParam
		return err
	}
	if playerRestaurant.State != models.RESTAURANT_S_BUILDING_OR_UPGRADING {
		resp.Ret = Constants.RetCode.InvalidRequestParam
		return err
	}
	lvConf, err := models.GetRestaurantLevelBinding(playerRestaurant.RestaurantID,
		playerRestaurant.CurrentLevel+1)

	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	ret, err := models.AddPlayerWallet(tx, playerId,
		lvConf.BuildingOrUpgradingCostCurrency, lvConf.BuildingOrUpgradingCostVal)
	if err != nil || ret != 0 {
		resp.Ret = ret
		return err
	}
	ok, err := models.CancelRestaurantUpgrading(tx, id, now)
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	if !ok {
		resp.Ret = Constants.RetCode.InvalidRequestParam
		return nil
	}
	err = tx.Commit()
	if err != nil {
		resp.Ret = Constants.RetCode.MysqlError
		return err
	}
	walletSync(session, playerId)
	resp.Ret = Constants.RetCode.Ok

	return nil

}

var (
	restaurant_id int
	id            int
	player_id     int
	current_level int
)

type playerRestaurantInfo struct {
	NumChairs               int
	DiningDuration          int
	GuestSingleTripDuration int
}

type SeatsInfo struct {
	GuestSingleTripDuration int
	DiningDuration          int
	OccupiedSeats           []*OccupiedSeat
}

type OccupiedSeat struct {
	CharNum int
	State   int //0空位1占了
}
type DiningTimer struct {
	CharNum int
	StartAt int64
}

const (
	Empty    = 0
	NotEmpty = 1
)

func HandleGenGold() {
	Logger.Debug("HandleGenGold start")
	rows, err := models.GenGuest()
	defer rows.Close()
	for rows.Next() {
		err := rows.Scan(&restaurant_id, &id, &player_id, &current_level)
		if err != nil {
			Logger.Debug("HandleTimer", zap.Any("mysql error", err))
		}
		addRestaurantCached(player_id, restaurant_id, id)
	}
	err = rows.Err()
	if err != nil {
		Logger.Debug("HandleGenGuest", zap.Any("mysql rows", err))
	}
	if err != nil {
		Logger.Debug("HandleGenGuest", zap.Error(err))
	}
}
func HandleGenGuest() {
	Logger.Debug("HandleGenGuest start")
	rows, err := models.GenGuest()
	defer rows.Close()
	for rows.Next() {
		err := rows.Scan(&restaurant_id, &id, &player_id, &current_level)
		if err != nil {
			Logger.Debug("HandleGenGuest", zap.Any("mysql error", err))
		}
		lvConf, err := models.GetRestaurantLevelBinding(restaurant_id, current_level)
		if err != nil {
			Logger.Info("redis", zap.Any("redis mysql err", err))
		}
		genGuestMsg(player_id, id, restaurant_id, lvConf.GuestSingleTripDuration, lvConf.DiningDuration)
	}
	err = rows.Err()
	if err != nil {
		Logger.Debug("HandleGenGuest", zap.Any("mysql rows", err))
	}
	if err != nil {
		Logger.Debug("HandleGenGuest", zap.Error(err))
	}
}

//内部函数
func genGuestMsg(playerId int, playerRestaurantBindingId int, restaurantId int, singleTripWalkingDuration int, diningDuration int) {
	data := &struct {
		PlayerRestaurantBinding   int `json:"playerRestaurantBindingId"`
		RestaurantId              int `json:"restaurantId"`
		RingleTripWalkingDuration int `json:"singleTripWalkingDuration"`
		DiningDuration            int `json:"diningDuration"`
	}{id, restaurant_id, singleTripWalkingDuration, diningDuration}
	if wsConnManager.GetSession(player_id) != nil {
		session := wsConnManager.GetSession(player_id)
		wsSend(session, "GuestGenerated", data)
	}
}
func genGoldMsg(playerId int, playerRestaurantBindingId int, restaurantId int, gold float64, energy float64) {
	data := &struct {
		PlayerRestaurantBinding int     `json:"playerRestaurantBindingId"`
		RestaurantId            int     `json:"restaurantId"`
		Gold                    float64 `json:"gold"`
		Energy                  float64 `json:"energy"`
	}{id, restaurant_id, gold, energy}
	if wsConnManager.GetSession(player_id) != nil {
		session := wsConnManager.GetSession(player_id)
		wsSend(session, "GoldGenerated", data)
	}
}

func addRestaurantCached(playerId int, restaurantId int, playerRestaurantId int) {
	//更新player_restaurant_binding的cached数据
	gold, energy, err := getEveryGuestGoldAndEnergyWhenCookIsWorking(playerId, restaurantId)
	if err != nil {
		Logger.Info("gold energy generator fail", zap.Any("errCode", int(gold)))
	}
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	addGoldRet, err := models.AddRestaurantCached(tx, playerRestaurantId, Constants.Player.Gold, gold)
	if err != nil || addGoldRet != 0 {
		Logger.Debug("HandleGenGuest", zap.Any("mysql AddRestaurantCached", err))
	}
	addEnergyRet, err := models.AddRestaurantCached(tx, playerRestaurantId, Constants.Player.Energy, energy)
	if err != nil || addEnergyRet != 0 {
		Logger.Debug("HandleGenGuest", zap.Any("mysql AddRestaurantCached", err))
	}
	err = tx.Commit()
	if err != nil {
		Logger.Debug("HandleGenGuest", zap.Any("mysql error", err))
	}
	genGoldMsg(playerId, playerRestaurantId, restaurantId, gold, energy)
}

func getEveryGuestGoldAndEnergyWhenCookIsWorking(playerId int, restaurantId int) (float64, float64, error) {
	var MysqlError float64 = float64(Constants.RetCode.MysqlError)
	playerRestaurantCookBinding, err := models.GetPlayerRestaurantCookBindingByPlayerIdAndRestaurantId(playerId, restaurantId)
	if err != nil {
		if err != nil {
			return MysqlError, 0, err
		}
	}
	if playerRestaurantCookBinding != nil {
		cookId := playerRestaurantCookBinding.CookID
		playerCookBinding, err := models.GetPlayerCookBindingByPlayerIdAndCookId(playerId, cookId)
		if err != nil {
			return MysqlError, 0, err
		}
		if playerCookBinding == nil {
			Logger.Info("get playerCookBinding not exist error", zap.Any("playerId:", playerId), zap.Int("cookId", cookId))
			return MysqlError, 0, errors.New("playerCookBinding not exist")
		}
		cook, err := models.GetCookById(playerCookBinding.CookID)
		if err != nil {
			return MysqlError, 0, err
		}
		if cook == nil {
			return MysqlError, 0, errors.New("cook not exist")
		}
		var playerCookFoodBindingList []*models.CookFoodBinding
		var playerCookFoodBindingDict map[int]*models.CookFoodBinding
		if cook.NumFood > 0 {
			var err error
			playerCookFoodBindingList = make([]*models.CookFoodBinding, cook.NumFood)
			playerCookFoodBindingList, err = models.GetCookFoodBindingList(cook.ID)
			if err != nil {
				return MysqlError, 0, err
			}
			if playerCookFoodBindingList == nil {
				Logger.Info("get playerCookFoodBindingList error", zap.Any("cook:", cook))
			}
			playerCookFoodBindingDict = make(map[int]*models.CookFoodBinding, len(playerCookFoodBindingList))
			for _, v := range playerCookFoodBindingList {
				playerCookFoodBindingDict[v.FoodID] = v
			}
		}

		playerRestaurantFoodBindingList, err := models.GetPlayerRestaurantFoodBindingList(playerId, restaurantId)
		if err != nil {
			return MysqlError, 0, err
		}
		if playerRestaurantFoodBindingList == nil {
			Logger.Info("get playerRestaurantFoodBindingList error", zap.Any("restaurantId:", restaurantId))
		}
		playerRestaurantFoodIds := make([]int, len(playerRestaurantFoodBindingList))
		for i, v := range playerRestaurantFoodBindingList {
			playerRestaurantFoodIds[i] = v.FoodID
		}
		playerRestaurantFoodList, err := models.GetFoodListByIds(playerRestaurantFoodIds)
		if err != nil {
			return MysqlError, 0, err
		}

		var gold float64 = float64(playerCookBinding.GoldAddition) / 20
		var energy float64 = float64(playerCookBinding.EnergyAddition) / 160
		for _, v := range playerRestaurantFoodList {
			if playerCookFoodBindingDict[v.ID] != nil {
				if playerCookFoodBindingDict[v.ID].PriceAdditionCurrency == Constants.Player.Gold {
					gold = gold + float64(v.Price)*playerCookFoodBindingDict[v.ID].PriceAdditionValue
				}
				if playerCookFoodBindingDict[v.ID].PriceAdditionCurrency == Constants.Player.Energy {
					energy = energy + float64(v.EnergyOutput)*playerCookFoodBindingDict[v.ID].PriceAdditionValue
				}
			} else {
				gold = gold + float64(v.Price)
				energy = energy + float64(v.EnergyOutput)
			}
		}
		return gold, energy, nil
	} else {
		playerRestaurantFoodBindingList, err := models.GetPlayerRestaurantFoodBindingList(playerId, restaurantId)
		if err != nil {
			return MysqlError, 0, err
		}
		if playerRestaurantFoodBindingList == nil {
			Logger.Info("get playerRestaurantFoodBindingList error", zap.Any("restaurantId:", restaurantId))
		}
		playerRestaurantFoodIds := make([]int, len(playerRestaurantFoodBindingList))
		for i, v := range playerRestaurantFoodBindingList {
			playerRestaurantFoodIds[i] = v.FoodID
		}
		playerRestaurantFoodList, err := models.GetFoodListByIds(playerRestaurantFoodIds)
		if err != nil {
			return MysqlError, 0, err
		}
		var gold float64 = 0
		var energy float64 = 0
		for _, v := range playerRestaurantFoodList {
			gold = gold + float64(v.Price)
			energy = energy + float64(v.EnergyOutput)
		}
		return gold, energy, nil
	}
}
