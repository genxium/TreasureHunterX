package common

type constants struct {
	AuthChannel struct {
		Sms int `json:"SMS"`
	} `json:"AUTH_CHANNEL"`
	Player struct {
		Diamond                     int `json:"DIAMOND"`
		Energy                      int `json:"ENERGY"`
		Gold                        int `json:"GOLD"`
		IntAuthTokenTTLSeconds      int `json:"INT_AUTH_TOKEN_TTL_SECONDS"`
		SmsExpiredSeconds           int `json:"SMS_EXPIRED_SECONDS"`
		SmsValidResendPeriodSeconds int `json:"SMS_VALID_RESEND_PERIOD_SECONDS"`
	} `json:"PLAYER"`
	RetCode struct {
		CookAlreadyGeted                                 int    `json:"COOK_ALREADY_GETED"`
		Duplicated                                       int    `json:"DUPLICATED"`
		FailedToCreate                                   int    `json:"FAILED_TO_CREATE"`
		FailedToDelete                                   int    `json:"FAILED_TO_DELETE"`
		FailedToUpdate                                   int    `json:"FAILED_TO_UPDATE"`
		IncorrectCaptcha                                 int    `json:"INCORRECT_CAPTCHA"`
		IncorrectHandle                                  int    `json:"INCORRECT_HANDLE"`
		IncorrectPassword                                int    `json:"INCORRECT_PASSWORD"`
		IncorrectPhoneCountryCode                        int    `json:"INCORRECT_PHONE_COUNTRY_CODE"`
		IncorrectPhoneNumber                             int    `json:"INCORRECT_PHONE_NUMBER"`
		InsufficientMemToAllocateConnection              int    `json:"INSUFFICIENT_MEM_TO_ALLOCATE_CONNECTION"`
		InvalidEmailLiteral                              int    `json:"INVALID_EMAIL_LITERAL"`
		InvalidKioskCredentials                          int    `json:"INVALID_KIOSK_CREDENTIALS"`
		InvalidRequestParam                              int    `json:"INVALID_REQUEST_PARAM"`
		InvalidToken                                     int    `json:"INVALID_TOKEN"`
		IsTestAcc                                        int    `json:"IS_TEST_ACC"`
		KioskAlreadyConnected                            int    `json:"KIOSK_ALREADY_CONNECTED"`
		LackOfDiamond                                    int    `json:"LACK_OF_DIAMOND"`
		LackOfEnergy                                     int    `json:"LACK_OF_ENERGY"`
		LackOfGold                                       int    `json:"LACK_OF_GOLD"`
		MapNotUnlocked                                   int    `json:"MAP_NOT_UNLOCKED"`
		MysqlError                                       int    `json:"MYSQL_ERROR"`
		NewHandleConflict                                int    `json:"NEW_HANDLE_CONFLICT"`
		NonexistentAct                                   int    `json:"NONEXISTENT_ACT"`
		NonexistentActHandler                            int    `json:"NONEXISTENT_ACT_HANDLER"`
    LocallyNoAvailableRoom                           int    `json:"LOCALLY_NO_AVAILABLE_ROOM"`
		NonexistentKiosk                                 int    `json:"NONEXISTENT_KIOSK"`
		NotImplementedYet                                int    `json:"NOT_IMPLEMENTED_YET"`
		NoAssociatedEmail                                int    `json:"NO_ASSOCIATED_EMAIL"`
		Ok                                               int    `json:"OK"`
		PasswordResetCodeGenerationPerEmailTooFrequently int    `json:"PASSWORD_RESET_CODE_GENERATION_PER_EMAIL_TOO_FREQUENTLY"`
		SendEmailTimeout                                 int    `json:"SEND_EMAIL_TIMEOUT"`
		SmsCaptchaNotMatch                               int    `json:"SMS_CAPTCHA_NOT_MATCH"`
		SmsCaptchaRequestedTooFrequently                 int    `json:"SMS_CAPTCHA_REQUESTED_TOO_FREQUENTLY"`
		TradeCreationTooFrequently                       int    `json:"TRADE_CREATION_TOO_FREQUENTLY"`
		UnknownError                                     int    `json:"UNKNOWN_ERROR"`
		Comment                                          string `json:"__comment__"`
	} `json:"RET_CODE"`
	Ws struct {
		IntervalToPing        int `json:"INTERVAL_TO_PING"`
		WillKickIfInactiveFor int `json:"WILL_KICK_IF_INACTIVE_FOR"`
	} `json:"WS"`
}
