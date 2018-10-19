package env_tools

import (
	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
	_ "github.com/mattn/go-sqlite3"
	"go.uber.org/zap"
	. "server/common"
	"server/storage"
)

func LoadPreConf() {
	Logger.Info(`Merging PreConfSQLite data into MySQL`,
		zap.String("PreConfSQLitePath", Conf.General.PreConfSQLitePath))
	db, err := sqlx.Connect("sqlite3", Conf.General.PreConfSQLitePath)
	ErrFatal(err)
	defer db.Close()
	loadPreConfToMysql(db)
}

func loadPreConfToMysql(db *sqlx.DB) {
	// TODO
	tbs := []string{}
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
	defer Logger.Info("Loaded table " + v + " from PreConfSQLite successfully.")
	switch v {
	// TODO
	}
	err := tx.Commit()
	if err != nil {
		defer tx.Rollback()
		Logger.Info(v+" load", zap.Any("tx.commit error", err))
	}
}
