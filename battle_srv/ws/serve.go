package ws

import (
	"net/http"
	. "server/common"
	"server/models"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
)

const (
	READ_BUF_SIZE  = 8 * 1024
	WRITE_BUF_SIZE = 8 * 1024
	SEND_CHAN_SIZE = 128
)

var upgrader = websocket.Upgrader{
	ReadBufferSize:  READ_BUF_SIZE,
	WriteBufferSize: WRITE_BUF_SIZE,
	CheckOrigin: func(r *http.Request) bool {
		Logger.Debug("origin", zap.Any("origin", r.Header.Get("Origin")))
		return true
	},
}
var wsConnManager = NewManager()

func Serve(c *gin.Context) {
	token, ok := c.GetQuery("intAuthToken")
	if !ok {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	id, err := models.GetPlayerIdByToken(token)
	if err != nil || id == 0 {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
  //TODO:找出异地登录的bug
	//if wsConnManager.GetSession(id) != nil {
	//	Logger.Warn("Repeat login:", zap.Int("player_id", id))
	//	wsConnManager.delSession(wsConnManager.GetSession(id))
	//	//c.AbortWithStatus(http.StatusBadRequest)
	//	//return
	//}
	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		Logger.Warn("upgrade:", zap.Error(err))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	Logger.Debug("ConstVals.Ws.WillKickIfInactiveFor", zap.Duration("v", ConstVals.Ws.WillKickIfInactiveFor))
	session := wsConnManager.NewSession(id, conn, SEND_CHAN_SIZE)
	defer session.Close()
	wsConnManager.Debug()
	resp := wsResp{
		Ret:   Constants.RetCode.Ok,
		MsgId: 0,
		Act:   "HeartbeatRequirements",
		Data: struct {
			IntervalToPing        int `json:"intervalToPing"`
			WillKickIfInactiveFor int `json:"willKickIfInactiveFor"`
		}{Constants.Ws.IntervalToPing, Constants.Ws.WillKickIfInactiveFor},
	}
	session.Send(resp)
	for {
		conn.SetReadDeadline(time.Now().Add(ConstVals.Ws.WillKickIfInactiveFor))
		message, err := session.Receive()
		if err != nil {
			if websocket.IsUnexpectedCloseError(err, websocket.CloseNormalClosure) {
				Logger.Debug("read:", zap.Error(err))
			}
			break
		}
		if message.(*wsReq).Act != "HeartbeatPing" {
			Logger.Debug("recv:", zap.Any("msg", message))
		}
		resp := wsHandle(session, message.(*wsReq))
		err = session.Send(resp)
		if err != nil {
			Logger.Debug("write:", zap.Error(err))
			break
		}
	}
	c.Abort()
}
