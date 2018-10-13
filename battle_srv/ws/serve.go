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

func Serve(c *gin.Context) {
	token, ok := c.GetQuery("intAuthToken")
	if !ok {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
  // TODO: Wrap the following 2 stmts by sql transaction!
	playerId, err := models.GetPlayerIdByToken(token)
	if err != nil || playerId == 0 {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
  player, err := models.GetPlayerById(playerId)
	if err != nil || player == nil {
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		Logger.Warn("upgrade:", zap.Error(err))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	Logger.Debug("ConstVals.Ws.WillKickIfInactiveFor", zap.Duration("v", ConstVals.Ws.WillKickIfInactiveFor))

  var receivingLoopAgainstPlayer func() error
  var forwardingLoopAgainstBoundRoom func() error

  /**
  * "The default close handler sends a close message back to the peer." 
  *
  * "The connection read methods return a CloseError when a close message is received. Most applications should handle close messages as part of their normal error handling. Applications should only set a close handler when the application must perform some action before sending a close message back to the peer."
  *
  * from reference https://godoc.org/github.com/gorilla/websocket#Conn.SetCloseHandler. 
  */
  conn.SetCloseHandler(func(code int, text string) error {
	  Logger.Debug("Close handler triggered:", zap.Any("code", code), zap.Any("text", text))
    // TODO: Terminate ALL spawned goroutines.
    return nil
  });
	resp := wsResp{
		Ret:   Constants.RetCode.Ok,
		MsgId: 0,
		Act:   "HeartbeatRequirements",
		Data: struct {
			IntervalToPing        int `json:"intervalToPing"`
			WillKickIfInactiveFor int `json:"willKickIfInactiveFor"`
		}{Constants.Ws.IntervalToPing, Constants.Ws.WillKickIfInactiveFor},
	}

  err = conn.WriteJSON(resp)
  if err != nil {
    // TODO
  }

  // Starts the receiving loop against the client-side 
  receivingLoopAgainstPlayer = func() error{
    for {
      // Refreshes the handling of `HeartbeatRequirements`.
      conn.SetReadDeadline(time.Now().Add(ConstVals.Ws.WillKickIfInactiveFor))

      // Tries to receive from client-side in a non-blocking manner.
      var msg *wsReq
      msg = new(wsReq)
      err := conn.ReadJSON(msg)
      if err != nil {
        if websocket.IsUnexpectedCloseError(err, websocket.CloseNormalClosure) {
          Logger.Debug("read:", zap.Error(err))
        }
        break
      }
      if msg.Act != "HeartbeatPing" {
        Logger.Debug("recv:", zap.Any("msg", msg))
      }
      resp := wsGenerateRespectiveResp(conn, msg)
      err = conn.WriteJSON(resp)
      if err != nil {
        Logger.Debug("write:", zap.Error(err))
        break
      }
    }
    return nil
  }
  go receivingLoopAgainstPlayer()

  // Starts the forwarding loop associated "player.boundRoom".
  forwardingLoopAgainstBoundRoom = func() error {
    return nil
  }
  go forwardingLoopAgainstBoundRoom()
	c.Abort()
}
