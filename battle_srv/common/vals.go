package common

import (
	"regexp"
	"time"
)

var (
	RE_PHONE_NUM        = regexp.MustCompile(`^\+?[0-9]{8,14}$`)
	RE_SMS_CAPTCHA_CODE = regexp.MustCompile(`^[0-9]{4}$`)
)

// 隐式导入
var ConstVals = &struct {
	Player struct {
		CaptchaExpire time.Duration
		CaptchaMaxTTL time.Duration
	}
	Ws struct {
		WillKickIfInactiveFor time.Duration
	}
}{}

func constantsPost() {
	ConstVals.Player.CaptchaExpire = time.Duration(Constants.Player.SmsExpiredSeconds) * time.Second
	ConstVals.Player.CaptchaMaxTTL = ConstVals.Player.CaptchaExpire -
		time.Duration(Constants.Player.SmsValidResendPeriodSeconds)*time.Second

	ConstVals.Ws.WillKickIfInactiveFor = time.Duration(Constants.Ws.WillKickIfInactiveFor) * time.Millisecond
}
