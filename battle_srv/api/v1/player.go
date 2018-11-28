package v1

import (
	"github.com/gin-gonic/gin"
	"github.com/gin-gonic/gin/binding"
	"go.uber.org/zap"
	"net/http"
	"server/api"
	. "server/common"
	"server/common/utils"
	"server/models"
	"server/storage"
	"strconv"
)

var Player = playerController{}

type playerController struct {
}

type smsCaptchReq struct {
	Num         string `json:"phoneNum,omitempty" form:"phoneNum"`
	CountryCode string `json:"phoneCountryCode,omitempty" form:"phoneCountryCode"`
	Captcha     string `json:"smsLoginCaptcha,omitempty" form:"smsLoginCaptcha"`
}

func (req *smsCaptchReq) extAuthID() string {
	return req.CountryCode + req.Num
}
func (req *smsCaptchReq) redisKey() string {
	return "/cuisine/sms/captcha/" + req.extAuthID()
}

type intAuthTokenReq struct {
	Token string `form:"intAuthToken,omitempty"`
}

func (p *playerController) SMSCaptchaGet(c *gin.Context) {
	var req smsCaptchReq
	err := c.ShouldBindQuery(&req)
	api.CErr(c, err)
	if err != nil || req.Num == "" || req.CountryCode == "" {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}
	redisKey := req.redisKey()
	ttl, err := storage.RedisManagerIns.TTL(redisKey).Result()
	Logger.Debug("redis ttl", zap.String("key", redisKey), zap.Duration("ttl", ttl))
	api.CErr(c, err)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.UnknownError)
		return
	}
	// redis剩余时长校验
	if ttl >= ConstVals.Player.CaptchaMaxTTL {
		c.Set(api.RET, Constants.RetCode.SmsCaptchaRequestedTooFrequently)
		return
	}
	//Logger.Debug(ttl, Vals.Player.CaptchaMaxTTL)
	var pass bool
	var succRet int
	// 测试环境，优先从数据库校验，校验不通过，走手机号校验
	exist, err := models.ExistPlayerByName(req.Num)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	player, err := models.GetPlayerByName(req.Num)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	if player != nil {
		tokenExist, err := models.EnsuredPlayerLoginById(int(player.Id))
		if err != nil {
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
		if tokenExist {
			playerLogin, err := models.GetPlayerLoginByPlayerId(int(player.Id))
			if err != nil {
				c.Set(api.RET, Constants.RetCode.MysqlError)
				return
			}
			err = models.DelPlayerLoginByToken(playerLogin.IntAuthToken)
			if err != nil {
				c.Set(api.RET, Constants.RetCode.MysqlError)
				return
			}
		}
	}
	if Conf.General.ServerEnv == SERVER_ENV_TEST && exist {
		succRet = Constants.RetCode.IsTestAcc
		pass = true
	}
	if !pass {
		if RE_PHONE_NUM.MatchString(req.Num) {
			succRet = Constants.RetCode.Ok
			pass = true
		}
	}
	if !pass {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}
	resp := struct {
		Ret int `json:"ret"`
		smsCaptchReq
	}{Ret: succRet}
	var captcha string
	if ttl >= 0 {
		// 续验证码时长，重置剩余时长
		storage.RedisManagerIns.Expire(redisKey, ConstVals.Player.CaptchaExpire)
		captcha = storage.RedisManagerIns.Get(redisKey).Val()
		Logger.Debug("redis captcha", zap.String("key", redisKey), zap.String("captcha", captcha))
	} else {
		// 校验通过，进行验证码生成处理
		captcha = strconv.Itoa(utils.Rand.Number(1000, 9999))
		storage.RedisManagerIns.Set(redisKey, captcha, ConstVals.Player.CaptchaExpire)
		Logger.Debug("gen new captcha", zap.String("key", redisKey), zap.String("captcha", captcha))
	}
	if succRet == Constants.RetCode.IsTestAcc {
		resp.Captcha = captcha
	}
	c.JSON(http.StatusOK, resp)
}
func (p *playerController) SMSCaptchaLogin(c *gin.Context) {
	var req smsCaptchReq
	err := c.ShouldBindWith(&req, binding.FormPost)
	api.CErr(c, err)
	if err != nil || req.Num == "" || req.CountryCode == "" || req.Captcha == "" {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}
	redisKey := req.redisKey()
	captcha := storage.RedisManagerIns.Get(redisKey).Val()
	Logger.Debug("compare captcha", zap.String("redis", captcha), zap.String("req", req.Captcha))
	if captcha != req.Captcha {
		c.Set(api.RET, Constants.RetCode.SmsCaptchaNotMatch)
		return
	}

	player, err := p.maybeCreateNewPlayer(req)
	api.CErr(c, err)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	now := utils.UnixtimeMilli()
	token := utils.TokenGenerator(32)
	expiresAt := now + 1000*int64(Constants.Player.IntAuthTokenTTLSeconds)
	playerLogin := models.PlayerLogin{
		CreatedAt:    now,
		FromPublicIP: models.NewNullString(c.ClientIP()),
		IntAuthToken: token,
		PlayerID:     int(player.Id),
		DisplayName:  models.NewNullString(player.DisplayName),
		UpdatedAt:    now,
	}
	err = playerLogin.Insert()
	api.CErr(c, err)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	storage.RedisManagerIns.Del(redisKey)
	resp := struct {
		Ret       int    `json:"ret"`
		Token     string `json:"intAuthToken"`
		ExpiresAt int64  `json:"expiresAt"`
		PlayerID  int    `json:"playerId"`
    Name string `json:"name"`
	}{Constants.RetCode.Ok, token, expiresAt, int(player.Id), player.Name}

	c.JSON(http.StatusOK, resp)
}
func (p *playerController) IntAuthTokenLogin(c *gin.Context) {
	token := p.getIntAuthToken(c)
	if token == "" {
		return
	}
	playerLogin, err := models.GetPlayerLoginByToken(token)
	api.CErr(c, err)
	if err != nil || playerLogin == nil {
		c.Set(api.RET, Constants.RetCode.InvalidToken)
		return
	}
	if playerLogin.FromPublicIP != models.NewNullString(c.ClientIP()) {
		err = models.DelPlayerLoginByToken(playerLogin.IntAuthToken)
		if err != nil {
			c.Set(api.RET, Constants.RetCode.MysqlError)
			return
		}
		//新生成一个token
		token = utils.TokenGenerator(32)
	}
	expiresAt := playerLogin.UpdatedAt + 1000*int64(Constants.Player.IntAuthTokenTTLSeconds)
	resp := struct {
		Ret         int               `json:"ret"`
		Token       string            `json:"intAuthToken"`
		ExpiresAt   int64             `json:"expiresAt"`
		PlayerID    int               `json:"playerId"`
		DisplayName models.NullString `json:"displayName"`
	}{Constants.RetCode.Ok, token, expiresAt,
		playerLogin.PlayerID, playerLogin.DisplayName}
	c.JSON(http.StatusOK, resp)
}
func (p *playerController) IntAuthTokenLogout(c *gin.Context) {
	token := p.getIntAuthToken(c)
	if token == "" {
		return
	}
	err := models.DelPlayerLoginByToken(token)
	api.CErr(c, err)
	if err != nil {
		c.Set(api.RET, Constants.RetCode.UnknownError)
		return
	}
	c.Set(api.RET, Constants.RetCode.Ok)
}
func (p *playerController) FetchProfile(c *gin.Context) {
	playerId := c.GetInt(api.PLAYER_ID)
	wallet, err := models.GetPlayerWalletById(playerId)
	if err != nil {
		api.CErr(c, err)
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	player, err := models.GetPlayerById(playerId)
	if err != nil {
		api.CErr(c, err)
		c.Set(api.RET, Constants.RetCode.MysqlError)
		return
	}
	if wallet == nil || player == nil {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return
	}
	resp := struct {
		Ret           int                  `json:"ret"`
		TutorialStage int                  `json:"tutorialStage"`
		Wallet        *models.PlayerWallet `json:"wallet"`
	}{Constants.RetCode.Ok, player.TutorialStage, wallet}
	c.JSON(http.StatusOK, resp)
}

func (p *playerController) TokenWithPlayerIdAuth(c *gin.Context) {
	var req struct {
		Token    string `form:"intAuthToken"`
		PlayerId int    `form:"targetPlayerId"`
	}
	err := c.ShouldBindWith(&req, binding.FormPost)
	if err == nil {
		exist, err := models.EnsuredPlayerLoginByToken(int(req.PlayerId), req.Token)
		api.CErr(c, err)
		if err == nil && exist {
			c.Set(api.PLAYER_ID, req.PlayerId)
			return
		}
	}
	Logger.Debug("TokenWithPlayerIdAuth Failed", zap.String("token", req.Token),
		zap.Int("id", req.PlayerId))
	c.Set(api.RET, Constants.RetCode.InvalidToken)
	c.Abort()
}

func (p *playerController) TokenAuth(c *gin.Context) {
	var req struct {
		Token string `form:"intAuthToken"`
	}
	err := c.ShouldBindWith(&req, binding.FormPost)
	if err == nil {
		playerLogin, err := models.GetPlayerLoginByToken(req.Token)
		api.CErr(c, err)
		if err == nil && playerLogin != nil {
			c.Set(api.PLAYER_ID, playerLogin.PlayerID)
			return
		}
	}
	Logger.Debug("TokenAuth Failed", zap.String("token", req.Token))
	c.Set(api.RET, Constants.RetCode.InvalidToken)
	c.Abort()
}

// 以下是内部私有函数
func (p *playerController) maybeCreateNewPlayer(req smsCaptchReq) (*models.Player, error) {
	extAuthID := req.extAuthID()
	if Conf.General.ServerEnv == SERVER_ENV_TEST {
		player, err := models.GetPlayerByName(req.Num)
		if err != nil {
      Logger.Error("Seeking test env player error:", zap.Error(err))
			return nil, err
		}
		if player != nil {
      Logger.Info("Got a test env player:", zap.Any("phonenum", req.Num), zap.Any("playerId", player.Id))
			return player, nil
		}
	}
	bind, err := models.GetPlayerAuthBinding(Constants.AuthChannel.Sms, extAuthID)
	if err != nil {
		return nil, err
	}
	if bind != nil {
		player, err := models.GetPlayerById(bind.PlayerID)
		if err != nil {
			return nil, err
		}
		if player != nil {
			return player, nil
		}
	}
	return p.createNewPlayer(extAuthID)
}

func (p *playerController) createNewPlayer(extAuthID string) (*models.Player, error) {
	Logger.Debug("createNewPlayer", zap.String("extAuthID", extAuthID))
	tx := storage.MySQLManagerIns.MustBegin()
	defer tx.Rollback()
	now := utils.UnixtimeMilli()
	player := models.Player{
		CreatedAt: now,
		UpdatedAt: now,
	}
	err := player.Insert(tx)
	if err != nil {
		return nil, err
	}
	playerAuthBinding := models.PlayerAuthBinding{
		CreatedAt: now,
		UpdatedAt: now,
		Channel:   int(Constants.AuthChannel.Sms),
		ExtAuthID: extAuthID,
		PlayerID:  int(player.Id),
	}
	err = playerAuthBinding.Insert(tx)
	if err != nil {
		return nil, err
	}
	wallet := models.PlayerWallet{
		CreatedAt: now,
		UpdatedAt: now,
		ID:        int(player.Id),
	}
	err = wallet.Insert(tx)
	if err != nil {
		return nil, err
	}
	tx.Commit()
	return &player, nil
}

func (p *playerController) getIntAuthToken(c *gin.Context) string {
	var req intAuthTokenReq
	err := c.ShouldBindWith(&req, binding.FormPost)
	api.CErr(c, err)
	if err != nil || req.Token == "" {
		c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
		return ""
	}
	return req.Token
}
