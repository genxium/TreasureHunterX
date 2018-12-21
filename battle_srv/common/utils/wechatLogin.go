package utils

import (
	"bytes"
	"encoding/json"
	"fmt"
	"go.uber.org/zap"
	"io/ioutil"
	"net/http"
	. "server/common"
)

type wechat struct {
	config *WechatConfig
}

type WechatConfig struct {
	ApiProtocol string
	ApiGateway  string
	AppID       string
	AppSecret   string
}

// CommonError 微信返回的通用错误json
type CommonError struct {
	ErrCode int64  `json:"errcode"`
	ErrMsg  string `json:"errmsg"`
}

// ResAccessToken 获取用户授权access_token的返回结果
type resAccessToken struct {
	CommonError

	AccessToken  string `json:"access_token"`
	ExpiresIn    int64  `json:"expires_in"`
	RefreshToken string `json:"refresh_token"`
	OpenID       string `json:"openid"`
	Scope        string `json:"scope"`
}

func NewWechatIns(conf *WechatConfig) *wechat {
	newWechat := &wechat{
		config: conf,
	}
	return newWechat
}

func (w *wechat) GetOauth2Basic(authcode string) (result resAccessToken, err error) {
	accessTokenURL := w.config.ApiProtocol + "://" + w.config.ApiGateway + "/sns/oauth2/access_token?appid=%s&secret=%s&code=%s&grant_type=authorization_code"
	urlStr := fmt.Sprintf(accessTokenURL, w.config.AppID, w.config.AppSecret, authcode)
	response, err := get(urlStr)
	if err != nil {
		return
	}
	err = json.Unmarshal(response, &result)
	if err != nil {
		Logger.Info("GetOauth2Basic marshal error", zap.Any("err", err))
		return
	}
	if result.ErrCode != 0 {
		err = fmt.Errorf("GetOauth2Basic error : errcode=%v , errmsg=%v", result.ErrCode, result.ErrMsg)
		return
	}
	return
}

//UserInfo 用户授权获取到用户信息
type UserInfo struct {
	CommonError
	OpenID     string   `json:"openid"`
	Nickname   string   `json:"nickname"`
	Sex        int32    `json:"sex"`
	Province   string   `json:"province"`
	City       string   `json:"city"`
	Country    string   `json:"country"`
	HeadImgURL string   `json:"headimgurl"`
	Privilege  []string `json:"privilege"`
	Unionid    string   `json:"unionid"`
}

func (w *wechat) GetMoreInfo(accessToken string, openId string) (result UserInfo, err error) {
	userInfoURL := w.config.ApiProtocol + "://" + w.config.ApiGateway + "/sns/userinfo?appid=%s&access_token=%s&openid=%s&lang=zh_CN"
	urlStr := fmt.Sprintf(userInfoURL, w.config.AppID, accessToken, openId)
	response, err := get(urlStr)
	if err != nil {
		return
	}
	err = json.Unmarshal(response, &result)
	if err != nil {
		Logger.Info("GetMoreInfo marshal error", zap.Any("err", err))
		return
	}
	if result.ErrCode != 0 {
		err = fmt.Errorf("GetMoreInfo error : errcode=%v , errmsg=%v", result.ErrCode, result.ErrMsg)
		return
	}
	return
}

//HTTPGet get 请求
func get(uri string) ([]byte, error) {
	response, err := http.Get(uri)
	if err != nil {
		return nil, err
	}

	defer response.Body.Close()
	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("http get error : uri=%v , statusCode=%v", uri, response.StatusCode)
	}
	body, err := ioutil.ReadAll(response.Body)
	if err != nil {
		return nil, err
	}
	return body, err
}

//PostJSON post json 数据请求
func post(uri string, obj interface{}) ([]byte, error) {
	jsonData, err := json.Marshal(obj)
	if err != nil {
		return nil, err
	}

	jsonData = bytes.Replace(jsonData, []byte("\\u003c"), []byte("<"), -1)
	jsonData = bytes.Replace(jsonData, []byte("\\u003e"), []byte(">"), -1)
	jsonData = bytes.Replace(jsonData, []byte("\\u0026"), []byte("&"), -1)

	body := bytes.NewBuffer(jsonData)
	response, err := http.Post(uri, "application/json;charset=utf-8", body)
	if err != nil {
		return nil, err
	}
	defer response.Body.Close()

	if response.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("http get error : uri=%v , statusCode=%v", uri, response.StatusCode)
	}
	return ioutil.ReadAll(response.Body)
}
