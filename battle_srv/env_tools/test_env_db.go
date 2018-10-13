package env_tools

import (
  . "server/common"
  "server/models"
  "server/storage"
  "server/common/utils"

  "github.com/jmoiron/sqlx"
  _ "github.com/mattn/go-sqlite3"
  "go.uber.org/zap"
)

func MergeTestPlayerAccounts()  {
  fp := Conf.General.TestEnvSQLitePath
  Logger.Info(`Initializing TestPlayerAccounts in runtime MySQLServer from SQLite file:`, zap.String("fp", fp))
  db, err := sqlx.Connect("sqlite3", fp)
  ErrFatal(err)
  defer db.Close()
  maybeCreateNewPlayer(db)
}

type dbTestPlayer struct {
  Name string  `db:"name"`
  MagicPhoneCountryCode string  `db:"magic_phone_country_code"`
  MagicPhoneNum string  `db:"magic_phone_num"`
}

func maybeCreateNewPlayer(db *sqlx.DB) {
  var ls []*dbTestPlayer
  err := db.Select(&ls, "SELECT name, magic_phone_country_code, magic_phone_num FROM test_player")
  ErrFatal(err)
  names := make([]string, len(ls), len(ls))
  for i, v := range ls {
    names[i] = v.Name
  }
  sql := "SELECT name FROM `player` WHERE name in (?)"
  query, args, err := sqlx.In(sql, names)
  ErrFatal(err)
  query = storage.MySQLManagerIns.Rebind(query)
  // existNames := make([]string, len(ls), len(ls))
  var existPlayers []*models.Player
  err = storage.MySQLManagerIns.Select(&existPlayers, query, args...)
  ErrFatal(err)

  for _, testPlayer := range ls {
    var flag bool
    for _, v := range existPlayers {
      if testPlayer.Name == v.Name {
        // 已有数据，合并处理
        flag = true
        break
      }
    }
    if !flag {
      // 找不到，新增
      Logger.Debug("create" ,zap.Any("testPlayer", testPlayer))
      err := createNewPlayer(testPlayer)
      if err != nil {
        Logger.Warn("createNewPlayer from test player", zap.NamedError("createNewPlayerErr", err))
      }
    }
  }
}

func createNewPlayer(p *dbTestPlayer) error {
  tx := storage.MySQLManagerIns.MustBegin()
  defer tx.Rollback()
  now := utils.UnixtimeMilli()
  player := models.Player{
    CreatedAt: now,
    UpdatedAt: now,
    Name: p.Name,
  }
  err := player.Insert(tx)
  if err != nil {
    return err
  }
  playerAuthBinding := models.PlayerAuthBinding{
   CreatedAt: now,
   UpdatedAt: now,
   Channel: int(Constants.AuthChannel.Sms),
   ExtAuthID: p.MagicPhoneCountryCode+p.MagicPhoneNum,
   PlayerID: player.ID,
  }
  err = playerAuthBinding.Insert(tx)
  if err != nil {
    return err
  }

  wallet := models.PlayerWallet{
    CreatedAt: now,
    UpdatedAt: now,
    ID: player.ID,
  }
  err = wallet.Insert(tx)
  if err != nil {
    return err
  }
  tx.Commit()
  return nil
}
