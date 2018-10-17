package ws

import (
  "strconv"
  "net/http"
  . "server/common"
  "server/common/utils"
  "server/models"
  "time"
  "sync"
  "github.com/gin-gonic/gin"
  "github.com/gorilla/websocket"
  "go.uber.org/zap"
	"container/heap"
  "encoding/json"
  "fmt"
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

func startOrFeedHeartbeatWatchdog(conn *websocket.Conn) bool {
  if nil == conn {
    return false
  }
  conn.SetReadDeadline(time.Now().Add(time.Millisecond*(ConstVals.Ws.WillKickIfInactiveFor)))
  return true
}

func Serve(c *gin.Context) {
  token, ok := c.GetQuery("intAuthToken")
  if !ok {
    c.AbortWithStatus(http.StatusBadRequest)
    return
  }

  boundRoomIdStr, hasBoundRoomId := c.GetQuery("boundRoomId")
  var boundRoomId int
  if hasBoundRoomId {
    tmpBoundRoomId, atoierr := strconv.Atoi(boundRoomIdStr)
    if atoierr != nil {
      // TODO: Abort with specific message.
      c.AbortWithStatus(http.StatusBadRequest)
      return
    }
    boundRoomId = tmpBoundRoomId
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

  shouldStopAllGoroutinesOfThisPlayer := false
  signalToStopGoroutinesOfThisPlayer := func() {
    // To terminate ALL spawned goroutines, e.g. `receivingLoopAgainstPlayer`, `forwardingLoopAgainstBoundRoom`.
    shouldStopAllGoroutinesOfThisPlayer = true
  }
  signalToCloseConnOfThisPlayer := func() {
    // TODO: Allow to specify reasons.
    conn.Close()
    signalToStopGoroutinesOfThisPlayer()
  }
  onConnClosed := func(code int, text string) error {
    // Reference of `code` https://godoc.org/github.com/gorilla/websocket#pkg-constants.
    Logger.Info("Close handler triggered:", zap.Any("code", code), zap.Any("playerId", playerId), zap.Any("message", text))
    signalToStopGoroutinesOfThisPlayer()
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

  pPlayer, err := models.GetPlayerById(playerId)
  if err != nil || pPlayer == nil {
    // TODO: Abort with specific message.
    signalToCloseConnOfThisPlayer()
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
      signalToCloseConnOfThisPlayer()
    }
  }()
  Logger.Info("Acquired RoomHeapMux for player:", zap.Any("playerId", playerId))
  // Logger.Info("The RoomHeapManagerIns has:", zap.Any("addr", fmt.Sprintf("%p", models.RoomHeapManagerIns)), zap.Any("size", len(*(models.RoomHeapManagerIns))))
  var pRoom *models.Room
  defer func() {
    if pRoom != nil {
      heap.Push(models.RoomHeapManagerIns, pRoom)
      (models.RoomHeapManagerIns).Update(pRoom, pRoom.Score)
    }
    (models.RoomHeapManagerIns).PrintInOrder()
  }()
  if hasBoundRoomId {
    if tmpPRoom, existent := models.RoomMapManagerIns[boundRoomId]; existent {
      pRoom = tmpPRoom
      Logger.Info("Successfully got:\n", zap.Any("roomID", pRoom.ID), zap.Any("playerId", playerId))
      res := pRoom.ReAddPlayerIfPossible(pPlayer)
      if !res {
        panic(fmt.Sprintf("ReAddPlayerIfPossible returns false for roomID == %v, playerId == %v!", pRoom.ID, playerId))
      }
    } else {
      panic(fmt.Sprintf("Cannot get a (*Room) for PresumedBoundRoomId == %v, playerId == %v!", boundRoomId, playerId))
    }
  } else {
    pRoom = heap.Pop(models.RoomHeapManagerIns).(*models.Room)
    Logger.Info("Successfully popped:\n", zap.Any("roomID", pRoom.ID), zap.Any("playerId", playerId))
    res := pRoom.AddPlayerIfPossible(pPlayer)
    if !res {
      panic(fmt.Sprintf("AddPlayerIfPossible returns false for roomID == %v, playerId == %v!", pRoom.ID, playerId))
    }
  }

  var connIOMux sync.RWMutex

  resp := wsResp{
    Ret:   Constants.RetCode.Ok,
    MsgId: 0,
    Act:   "HeartbeatRequirements",
    Data: struct {
      IntervalToPing        int `json:"intervalToPing"`
      WillKickIfInactiveFor int `json:"willKickIfInactiveFor"`
      BoundRoomId                int `json:"boundRoomId"`
    }{Constants.Ws.IntervalToPing, Constants.Ws.WillKickIfInactiveFor, pRoom.ID},
  }

  connIOMux.Lock()
  err = conn.WriteJSON(resp)
  connIOMux.Unlock()
  if err != nil {
    Logger.Warn("HeartbeatRequirements resp not written:", zap.Any("playerId", playerId), zap.Error(err))
    // TODO: Abort with specific message.
    c.AbortWithStatus(http.StatusBadRequest)
  }

  // Starts the receiving loop against the client-side 
  receivingLoopAgainstPlayer := func() error{
    defer func() {
      Logger.Info("Goroutine `receivingLoopAgainstPlayer` is stopped for:", zap.Any("playerId", playerId))
    }()
    for {
      if shouldStopAllGoroutinesOfThisPlayer {
        return nil
      }

      // Tries to receive from client-side in a non-blocking manner.
      var pReq *wsReq
      pReq = new(wsReq)
      err := conn.ReadJSON(pReq)
      if err != nil {
        if websocket.IsUnexpectedCloseError(err, websocket.CloseNormalClosure) {
          Logger.Debug("read:", zap.Error(err))
        }
        signalToStopGoroutinesOfThisPlayer()
      }
      startOrFeedHeartbeatWatchdog(conn)
      if pReq.Act == "PlayerUpsyncCmd" {
        immediatePlayerData := new(models.Player)
        json.Unmarshal([]byte(pReq.Data), immediatePlayerData)
        // Logger.Info("Unmarshalled `PlayerUpsyncCmd`:", zap.Any("immediatePlayerData", immediatePlayerData))
        if immediatePlayerData.ID != playerId {
          // WARNING: This player is cheating!
          Logger.Warn("Player cheats in reporting its own identity:", zap.Any("playerId", playerId), zap.Any("immediatePlayerData.ID", immediatePlayerData.ID))
          // TODO: Abort with specific message.
          signalToCloseConnOfThisPlayer()
        } else {
          utils.SendSafely(immediatePlayerData, pRoom.CmdFromPlayersChan)
        }
      } else {
        if pReq.Act != "HeartbeatPing" {
          Logger.Info("recv:", zap.Any("req", pReq))
        }
        resp := wsGenerateRespectiveResp(conn, pReq)
        connIOMux.Lock()
        err = conn.WriteJSON(resp)
        connIOMux.Unlock()
        if err != nil {
          Logger.Debug("write:", zap.Error(err))
          return nil
        }
      }
    }
    return nil
  }

  // Starts the forwarding loop associated "(*pPlayer).boundRoom".
  forwardingLoopAgainstBoundRoom := func(dedicatedChanToForward chan interface{}) error {
    defer func() {
      Logger.Info("Goroutine `forwardingLoopAgainstBoundRoom` is stopped for:", zap.Any("playerId", playerId), zap.Any("roomID", pRoom.ID))
    }()
    for {
      if shouldStopAllGoroutinesOfThisPlayer {
        return nil
      }
      select {
        case untypedRoomDownsyncFrame, hasRead := <-dedicatedChanToForward:
          if !hasRead {
            return nil
          }
          typedRoomDownsyncFrame := untypedRoomDownsyncFrame.(*models.RoomDownsyncFrame)
          connIOMux.Lock()
          // Logger.Info("Goroutine `forwardingLoopAgainstBoundRoom` sending:", zap.Any("RoomDownsyncFrame", typedRoomDownsyncFrame), zap.Any("playerId", playerId))
          wsSendAction(conn, "RoomDownsyncFrame", typedRoomDownsyncFrame)
          connIOMux.Unlock()
        default:
      }
    }
    return nil
  }
  startOrFeedHeartbeatWatchdog(conn)
  go receivingLoopAgainstPlayer()
  go forwardingLoopAgainstBoundRoom(pRoom.PlayerDownsyncChanDict[playerId])
}
