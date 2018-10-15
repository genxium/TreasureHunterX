package ws

import (
  "net/http"
  . "server/common"
  "server/models"
  "time"
  "github.com/gin-gonic/gin"
  "github.com/gorilla/websocket"
  "go.uber.org/zap"
	"container/heap"
	"math/rand"
)

const (
  READ_BUF_SIZE  = 8 * 1024
  WRITE_BUF_SIZE = 8 * 1024
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
    // TODO: Abort with specific message.
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

  pPlayer, err := models.GetPlayerById(playerId)
  if err != nil || pPlayer == nil {
    // TODO: Abort with specific message.
    c.AbortWithStatus(http.StatusBadRequest)
    return
  }

  // Pop a room to join.
  Logger.Info("About to acquire RoomHeapMux for player:", zap.Any("playerId", playerId))
  (*(models.RoomHeapMux)).Lock()
  defer func() {
    (*(models.RoomHeapMux)).Unlock()
    Logger.Info("Released RoomHeapMux for player:", zap.Any("playerId", playerId))
  }()
  defer func() {
    if r := recover(); r != nil {
      Logger.Warn("Recovered from: ", zap.Any("panic", r))
      // TODO: Abort with specific message.
      c.AbortWithStatus(http.StatusBadRequest)
    }
  }()
  Logger.Info("Acquired RoomHeapMux for player:", zap.Any("playerId", playerId))
  // Logger.Info("The RoomHeapManagerIns has:", zap.Any("addr", fmt.Sprintf("%p", models.RoomHeapManagerIns)), zap.Any("size", len(*(models.RoomHeapManagerIns))))
  pRoom := heap.Pop(models.RoomHeapManagerIns).(*models.Room)
  Logger.Info("Successfully popped:\n", zap.Any("roomID", pRoom.ID), zap.Any("playerId", playerId))
  randomMillisToSleepAgain := rand.Intn(100) // [0, 100) milliseconds.
  time.Sleep(time.Duration(randomMillisToSleepAgain) * time.Millisecond)
  _ = pRoom.AddPlayerIfPossible(pPlayer)
  heap.Push(models.RoomHeapManagerIns, pRoom)
  (models.RoomHeapManagerIns).Update(pRoom, pRoom.Score)
  (models.RoomHeapManagerIns).PrintInOrder()

  isConnAskedToClose := false
  onConnClosed := func(code int, text string) error {
    // Reference of `code` https://godoc.org/github.com/gorilla/websocket#pkg-constants.
    Logger.Info("Close handler triggered:", zap.Any("code", code), zap.Any("playerId", playerId), zap.Any("message", text))
    isConnAskedToClose = true // To terminate ALL spawned goroutines.
    return nil
  }

  /**
  * "The default close handler sends a close message back to the peer." 
  *
  * "The connection read methods return a CloseError when a close message is received. Most applications should handle close messages as part of their normal error handling. Applications should only set a close handler when the application must perform some action before sending a close message back to the peer."
  *
  * from reference https://godoc.org/github.com/gorilla/websocket#Conn.SetCloseHandler. 
  */
  conn.SetCloseHandler(onConnClosed);

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
    Logger.Warn("HeartbeatRequirements resp not written:", zap.Error(err))
    // TODO: Abort with specific message.
    c.AbortWithStatus(http.StatusBadRequest)
  }

  // Starts the receiving loop against the client-side 
  receivingLoopAgainstPlayer := func() error{
    for {
      if isConnAskedToClose == true {
        break
      }
      // Refreshes the handling of `HeartbeatRequirements`.
      conn.SetReadDeadline(time.Now().Add(ConstVals.Ws.WillKickIfInactiveFor))

      // Tries to receive from client-side in a non-blocking manner.
      var pReq *wsReq
      pReq = new(wsReq)
      err := conn.ReadJSON(pReq)
      if err != nil {
        if websocket.IsUnexpectedCloseError(err, websocket.CloseNormalClosure) {
          Logger.Debug("read:", zap.Error(err))
        }
        break
      }
      req := *pReq
      if req.Act != "HeartbeatPing" {
        Logger.Debug("recv:", zap.Any("req", req))
        select {
          case pRoom.CmdFromPlayersChan <- req:
          default:
        }
      }
      resp := wsGenerateRespectiveResp(conn, pReq)
      err = conn.WriteJSON(resp)
      if err != nil {
        Logger.Debug("write:", zap.Error(err))
        break
      }
    }
    Logger.Info("Goroutine `receivingLoopAgainstPlayer` is stopped for:", zap.Any("playerId", playerId))
    return nil
  }
  go receivingLoopAgainstPlayer()

  // Starts the forwarding loop associated "(*pPlayer).boundRoom".
  forwardingLoopAgainstBoundRoom := func() error {
    for {
      if isConnAskedToClose == true {
        break
      }
    }
    Logger.Info("Goroutine `forwardingLoopAgainstBoundRoom` is stopped for:", zap.Any("playerId", playerId))
    return nil
  }
  go forwardingLoopAgainstBoundRoom()
}
