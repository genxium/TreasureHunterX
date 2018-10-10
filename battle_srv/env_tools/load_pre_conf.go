package env_tools

import (
	. "server/common"
	"server/common/utils"
	"server/models"
	"server/storage"

	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
	"go.uber.org/zap"
)

func LoadPreConf() {
	Logger.Info(`from  sqlite merge into MySQL`,
		zap.String("RestaurantAndCookAndFoodAndBelongingSQLitePath", Conf.General.PreConfSQLitePath))
	db, err := sqlx.Connect("sqlite3", Conf.General.PreConfSQLitePath)
	ErrFatal(err)
	defer db.Close()
	loadPreConfToMysql(db)
}

func loadPreConfToMysql(db *sqlx.DB) {
	loadBelonging(db)
	loadBelongingBoundaryBinding(db)
	tbs := []string{"cook_upgrade_data", "cook", "cook_food_binding", "food",
		"restaurant_food_binding", "restaurant",
		"restaurant_level_binding"}
	loadSqlite(db, tbs)
}

func loadSqlite(db *sqlx.DB, tbs []string) {
	for _, v := range tbs {
		result, err := storage.MySQLManagerIns.Exec("truncate " + v)
		ErrFatal(err)
		Logger.Info("truncate", zap.Any("truncate "+v, result))
		query, args, err := sq.Select("*").From(v).ToSql()
		if err != nil {
			Logger.Info("loadSql ToSql error", zap.Any("err", err))
		}
		rows, err := db.Queryx(query, args...)
		if err != nil {
			Logger.Info("loadSql query error", zap.Any("err", err))
		}
		createMysqlData(rows, v)
	}
}

func createMysqlData(rows *sqlx.Rows, v string) {
	tx := storage.MySQLManagerIns.MustBegin()
	defer Logger.Info("load " + v + " success")
	defer tx.Rollback()
	switch v {
	case "cook":
		s := models.Cook{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Info(v+" load", zap.Any("sacnError", err))
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Info(v+" load", zap.Any("insert", insertErr))
			}
		}
	case "cook_food_binding":
		s := models.CookFoodBinding{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Info(v+" load", zap.Any("sacnError", err))
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Info(v+" load", zap.Any("insert", insertErr))
			}
		}
	case "cook_upgrade_data":
		s := models.CookUpgradeData{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Info(v+" load", zap.Any("sacnError", err))
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Info(v+" load", zap.Any("insert", insertErr))
			}
		}
	case "food":
		s := models.Food{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Info(v+" load", zap.Any("sacnError", err))
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Info(v+" load", zap.Any("insert", insertErr))
			}
		}
	case "restaurant_food_binding":
		s := models.RestaurantFoodBinding{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Info(v+" load", zap.Any("sacnError", err))
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Info(v+" load", zap.Any("insert", insertErr))
			}
		}
	case "restaurant":
		s := models.Restaurant{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Info(v+" load", zap.Any("sacnError", err))
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Info(v+" load", zap.Any("insert", insertErr))
			}
		}
	case "restaurant_level_binding":
		s := models.RestaurantLevelBinding{}
		for rows.Next() {
			err := rows.StructScan(&s)
			if err != nil {
				Logger.Info(v+" load", zap.Any("sacnError", err))
			}
			insertErr := s.Insert(tx)
			if insertErr != nil {
				Logger.Info(v+" load", zap.Any("insert", insertErr))
			}
		}
	}
	err := tx.Commit()
	if err != nil {
		Logger.Info(v+" load", zap.Any("tx.commit error", err))
	}
}

func loadBelongingBoundaryBinding(db *sqlx.DB) {
	var ls []*models.BelongingBoundaryBinding
	err := db.Select(&ls, "SELECT * FROM belonging_boundary_binding")
	ErrFatal(err)
	result, err := storage.MySQLManagerIns.Exec("truncate belonging_boundary_binding")
	ErrFatal(err)
	Logger.Info("truncate", zap.Any("truncate belonging_boundary_binding", result))
	defer Logger.Info("load belongingBoundaryBinding success")
	for _, sqliteBelongingBundaryBinding := range ls {
		err := createMysqlBelongingBoundaryBinding(sqliteBelongingBundaryBinding)
		if err != nil {
			Logger.Warn("create belonging_boundary_binding from sqlite", zap.NamedError("createBelongBoundaryBindingError", err))
		}
	}
}

func loadRestaurant(db *sqlx.DB) {
	var ls []*models.Restaurant
	err := db.Select(&ls, "SELECT * FROM restaurant")
	ErrFatal(err)
	result, err := storage.MySQLManagerIns.Exec("truncate restaurant")
	ErrFatal(err)
	Logger.Info("truncate", zap.Any("truncate restaurant", result))
	defer Logger.Info("load restaurant success")
	for _, sqliteRestaurant := range ls {
		err := createMysqlRestaurant(sqliteRestaurant)
		if err != nil {
			Logger.Warn("create restaurant from sqlite", zap.NamedError("createBelongBoundaryBindingError", err))
		}
	}
}

func loadRestaurantLevelBinding(db *sqlx.DB) {
	var ls []*models.RestaurantLevelBinding
	err := db.Select(&ls, "SELECT * FROM restaurant_level_binding")
	ErrFatal(err)
	result, err := storage.MySQLManagerIns.Exec("truncate restaurant_level_binding")
	ErrFatal(err)
	Logger.Info("truncate", zap.Any("truncate restaurant_level_binding", result))
	defer Logger.Info("load restaurantLevelBinding success")
	for _, sqliteRestaurantLevelBinding := range ls {
		err := createMysqlRestaurantLevelBinding(sqliteRestaurantLevelBinding)
		if err != nil {
			Logger.Warn("create restaurant_level_binding from sqlite", zap.NamedError("createRestaurantLEvelBinding Error", err))
		}
	}
}

func loadBelonging(db *sqlx.DB) {
	var ls []*models.Belonging
	err := db.Select(&ls, "SELECT gid FROM belonging")
	ErrFatal(err)
	result, err := storage.MySQLManagerIns.Exec("truncate belonging")
	ErrFatal(err)
	Logger.Info("truncate", zap.Any("truncate belonging", result))
	defer Logger.Info("load belonging success")
	for _, sqliteBelonging := range ls {
		err := createMysqlBelonging(sqliteBelonging)
		if err != nil {
			Logger.Warn("create belonging from sqlite", zap.NamedError("createBelongError", err))
		}
	}
}

func createMysqlBelonging(b *models.Belonging) error {
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	now := utils.UnixtimeMilli()
	belonging := models.Belonging{
		CreatedAt: now,
		UpdatedAt: now,
		Gid:       b.Gid,
	}
	err := belonging.Insert(tx)
	if err != nil {
		return err
	}
	tx.Commit()
	return nil
}

func createMysqlRestaurant(b *models.Restaurant) error {
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	restaurant := models.Restaurant{
		DisplayName: b.DisplayName,
		GeomapID:    b.GeomapID,
	}
	err := restaurant.Insert(tx)
	if err != nil {
		return err
	}
	tx.Commit()
	return nil
}

func createMysqlBelongingBoundaryBinding(b *models.BelongingBoundaryBinding) error {
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	belongingBoundaryBinding := models.BelongingBoundaryBinding{
		BelongingID:                 b.BelongingID,
		BoundaryType:                b.BoundaryType,
		CounterclockwisePoints:      b.CounterclockwisePoints,
		FirstPointOffsetFromAnchorY: b.FirstPointOffsetFromAnchorY,
		FirstPointOffsetFromAnchorX: b.FirstPointOffsetFromAnchorX,
	}
	err := belongingBoundaryBinding.Insert(tx)
	if err != nil {
		return err
	}
	tx.Commit()
	return nil
}

func createMysqlRestaurantLevelBinding(b *models.RestaurantLevelBinding) error {
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	restaurant_level_binding := models.RestaurantLevelBinding{
		BuildingOrUpgradingCostCurrency: b.BuildingOrUpgradingCostCurrency,
		BuildingOrUpgradingDuration:     b.BuildingOrUpgradingDuration,
		BuildingOrUpgradingCostVal:      b.BuildingOrUpgradingCostVal,
		DiningDuration:                  b.DiningDuration,
		GuestSingleTripDuration:         b.GuestSingleTripDuration,
		Level:                           b.Level,
		NumChairs:                       b.NumChairs,
		RestaurantID:                    b.RestaurantID,
		TmxPath:                         b.TmxPath,
	}
	err := restaurant_level_binding.Insert(tx)
	if err != nil {
		return err
	}
	tx.Commit()
	return nil
}
