package configs

type WechatConfig struct {
	ApiProtocol string
	ApiGateway  string
	AppID       string
	AppSecret   string
}

//fserver
var WechatConfigIns = WechatConfig{
	ApiProtocol: "http",
	ApiGateway:  "localhost:8089",
	AppID:       "wx5432dc1d6164d4e",
	AppSecret:   "secret1",
}

//production
//var WechatConfigIns = WechatConfig{
//	ApiProtocol: "http",
//	ApiGateway:  "localhost:8089",
//	AppID:       "wx5432dc1d6164d4e",
//	AppSecret:   "secret1",
//}
