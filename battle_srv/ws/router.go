package ws

import (
	. "server/common"
	"encoding/json"
	"reflect"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

type wsHandleInfo struct {
	reqType reflect.Type
	respAct string
}

type wsReq struct {
	MsgId int             `json:"msgId"`
	Act   string          `json:"act"`
	Data  json.RawMessage `json:"data"`
}

type wsResp struct {
	Ret   int         `json:"ret"`
	MsgId int         `json:"echoedMsgId"`
	Act   string      `json:"act"`
	Data  interface{} `json:"data"`
}

type wsHandler interface {
  // To be implemented by "subclasses".
	handle(*websocket.Conn, *wsResp) error
}

var wsRouter = make(map[string]*wsHandleInfo, 50)
func regHandleInfo(reqAct string, info *wsHandleInfo) {
  Logger.Info("Adding into wsRouter dict", zap.Any("act", reqAct))
	wsRouter[reqAct] = info
}

func wsGenerateRespectiveResp(conn *websocket.Conn, req *wsReq) *wsResp {
	var reqBody interface{}
	resp := &wsResp{
		MsgId: req.MsgId,
	}
	info, exists := wsRouter[req.Act]
	if !exists {
		resp.Ret = Constants.RetCode.NonexistentAct
		return resp
	}
	reqBody = reflect.New(info.reqType).Interface()
	err := json.Unmarshal(req.Data, &reqBody)
	if err != nil {
		Logger.Warn("json.Unmarshal", zap.Error(err))
		resp.Ret = Constants.RetCode.InvalidRequestParam
		return resp
	}
	h, ok := reqBody.(wsHandler)
	if !ok {
		resp.Ret = Constants.RetCode.NonexistentActHandler
		return resp
	}
	resp.Act = info.respAct
	err = h.handle(conn, resp)
	if err != nil {
		Logger.Warn("ws handle", zap.Error(err))
		if resp.Ret == 0 {
			resp.Ret = Constants.RetCode.UnknownError
		}
	}
	return resp
}

func wsSendAction(conn *websocket.Conn, act string, data interface{}) {
	resp := &wsResp{
		Act:  act,
		Data: data,
		Ret:  Constants.RetCode.Ok,
	}
  err := conn.WriteJSON(resp)
	if err != nil {
		Logger.Debug("write:", zap.Error(err))
	}
}
