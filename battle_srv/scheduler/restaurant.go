package scheduler

import (
	. "server/common"
	"server/models"

	"go.uber.org/zap"
)

func HandleRestaurantUpgrading() {
	//Logger.Debug("HandleRestaurantUpgrading start")
	err := models.CompleteRestaurantUpgrade()
	if err != nil {
		Logger.Debug("HandleRestaurantUpgrading", zap.Error(err))
	}
}

//type Manager struct {
//  disposed    bool
//  sessionMap  sync.Map
//  disposeOnce sync.Once
//  disposeWait sync.WaitGroup
//}
//
//func HandleGenGuest(wsConnManager *Manager) {
//	Logger.Debug("HandleGenGuest start")
//	err := models.GenGuest(wsConnManager)
//	if err != nil {
//		Logger.Debug("HandleGenGuest", zap.Error(err))
//	}
//}
