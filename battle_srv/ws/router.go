package ws

import (
	"encoding/json"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
	"reflect"
  "github.com/golang/protobuf/proto"
	. "server/common"
	"server/models"
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
	Ret                  int32    `json:"ret,omitempty"`
	EchoedMsgId          int32    `json:"echoedMsgId,omitempty"`
	Act                  string   `json:"act,omitempty"`
	Data                 interface{}   `json:"data,omitempty"`
}

type wsRespPb struct {
	Ret                  int32    `json:"ret,omitempty"`
	EchoedMsgId          int32    `json:"echoedMsgId,omitempty"`
	Act                  string   `json:"act,omitempty"`
	Data                 []byte   `json:"data,omitempty"`
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
		EchoedMsgId: int32(req.MsgId),
	}
	info, exists := wsRouter[req.Act]
	if !exists {
		resp.Ret = int32(Constants.RetCode.NonexistentAct)
		return resp
	}
	reqBody = reflect.New(info.reqType).Interface()
	err := json.Unmarshal(req.Data, &reqBody)
	if err != nil {
		Logger.Warn("json.Unmarshal", zap.Error(err))
		resp.Ret = int32(Constants.RetCode.InvalidRequestParam)
		return resp
	}
	h, ok := reqBody.(wsHandler)
	if !ok {
		resp.Ret = int32(Constants.RetCode.NonexistentActHandler)
		return resp
	}
	resp.Act = info.respAct
	err = h.handle(conn, resp)
	if err != nil {
		Logger.Warn("ws handle", zap.Error(err))
		if resp.Ret == 0 {
			resp.Ret = int32(Constants.RetCode.UnknownError)
		}
	}
	return resp
}

func wsSendAction(conn *websocket.Conn, act string, data interface{}) {
	resp := &wsResp{
		Act:  act,
		Data: data,
		Ret:  int32(Constants.RetCode.Ok),
	}
	err := conn.WriteJSON(resp)
	if err != nil {
		Logger.Error("write:", zap.Error(err))
	}
}

func wsSendActionPb(conn *websocket.Conn, act string, data *models.RoomDownsyncFrame) {
  // Reference https://godoc.org/github.com/gorilla/websocket#Conn.WriteMessage.
  out, err := proto.Marshal(data)
	if err != nil {
		Logger.Error("proto marshalling error:", zap.Error(err))
	}
	resp := &wsRespPb{
		Act:  act,
		Data: out,
		Ret:  int32(Constants.RetCode.Ok),
	}
	err = conn.WriteJSON(resp)
	if err != nil {
		Logger.Error("write:", zap.Error(err))
	}
}
