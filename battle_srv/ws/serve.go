package ws

import (
	"container/heap"
	"encoding/json"
	"fmt"
	"github.com/gin-gonic/gin"
	"github.com/gorilla/websocket"
	"go.uber.org/zap"
	"net/http"
	. "server/common"
	"server/common/utils"
	"server/models"
	"strconv"
	"sync"
	"sync/atomic"
	"time"
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
	conn.SetReadDeadline(time.Now().Add(time.Millisecond * (ConstVals.Ws.WillKickIfInactiveFor)))
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

	Logger.Info("Finding PlayerLogin record for ws authentication:", zap.Any("intAuthToken", token))

	// TODO: Wrap the following 2 stmts by sql transaction!
	playerId, err := models.GetPlayerIdByToken(token)
	if err != nil || playerId == 0 {
		// TODO: Abort with specific message.
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}

	Logger.Info("PlayerLogin record has been found for ws authentication:", zap.Any("playerId", playerId))

	conn, err := upgrader.Upgrade(c.Writer, c.Request, nil)
	if err != nil {
		Logger.Error("upgrade:", zap.Error(err))
		c.AbortWithStatus(http.StatusBadRequest)
		return
	}
	Logger.Debug("ConstVals.Ws.WillKickIfInactiveFor", zap.Duration("v", ConstVals.Ws.WillKickIfInactiveFor))
	/**
	 * WARNING: After successfully upgraded to use the "persistent connection" of http1.1/websocket protocol, you CANNOT overwrite the http1.0 resp status by `c.AbortWithStatus(...)` any more!
	 */
	var connIOMux sync.RWMutex

	connHasBeenSignaledToClose := int32(0)
	pConnHasBeenSignaledToClose := &connHasBeenSignaledToClose

	var pRoom *models.Room
	pRoom = nil
	signalToCloseConnOfThisPlayer := func(customRetCode int, customRetMsg string) {
		if swapped := atomic.CompareAndSwapInt32(pConnHasBeenSignaledToClose, 0, 1); !swapped {
			return
		}
		Logger.Warn("signalToCloseConnOfThisPlayer:", zap.Any("playerId", playerId), zap.Any("customRetCode", customRetCode), zap.Any("customRetMsg", customRetMsg))
		if nil != pRoom {
			pRoom.OnPlayerDisconnected(int32(playerId))
		}
		defer func() {
			if r := recover(); r != nil {
				Logger.Warn("Recovered from: ", zap.Any("panic", r))
			}
		}()
		/**
		 * References
		 * - https://tools.ietf.org/html/rfc6455
		 * - https://godoc.org/github.com/gorilla/websocket#hdr-Control_Messages
		 * - https://godoc.org/github.com/gorilla/websocket#FormatCloseMessage
		 * - https://godoc.org/github.com/gorilla/websocket#Conn.WriteControl
		 * - https://godoc.org/github.com/gorilla/websocket#hdr-Concurrency
		 *   - "The Close and WriteControl methods can be called concurrently with all other methods."
		 */

		/**
		 * References for the "WebsocketStdCloseCode"s. Note that we're using some "CustomCloseCode"s here as well.
		 *
		 * - https://tools.ietf.org/html/rfc6455#section-7.4
		 * - https://godoc.org/github.com/gorilla/websocket#pkg-constants.
		 */
		closeMessage := websocket.FormatCloseMessage(customRetCode, customRetMsg)
		err := conn.WriteControl(websocket.CloseMessage, closeMessage, time.Now().Add(time.Millisecond*(ConstVals.Ws.WillKickIfInactiveFor)))
		if err != nil {
			Logger.Error("Unable to send the CloseFrame control message to player(client-side):", zap.Any("playerId", playerId), zap.Error(err))
		}
	}

	onReceivedCloseMessageFromClient := func(code int, text string) error {
		Logger.Warn("Triggered `onReceivedCloseMessageFromClient`:", zap.Any("code", code), zap.Any("playerId", playerId), zap.Any("message", text))
		signalToCloseConnOfThisPlayer(code, text)
		return nil
	}

	/**
	 * - "SetCloseHandler sets the handler for close messages received from the peer."
	 *
	 * - "The default close handler sends a close message back to the peer."
	 *
	 * - "The connection read methods return a CloseError when a close message is received. Most applications should handle close messages as part of their normal error handling. Applications should only set a close handler when the application must perform some action before sending a close message back to the peer."
	 *
	 * from reference https://godoc.org/github.com/gorilla/websocket#Conn.SetCloseHandler.
	 */
	conn.SetCloseHandler(onReceivedCloseMessageFromClient)

	pPlayer, err := models.GetPlayerById(playerId)
	if err != nil || pPlayer == nil {
		// TODO: Abort with specific message.
		signalToCloseConnOfThisPlayer(Constants.RetCode.PlayerNotFound, "")
	}

	Logger.Info("Player has logged in and its profile is found from persistent storage:", zap.Any("playerId", playerId), zap.Any("play", pPlayer))

	// Find a room to join.
	Logger.Info("About to acquire RoomHeapMux for player:", zap.Any("playerId", playerId))
	(*(models.RoomHeapMux)).Lock()
	defer func() {
		(*(models.RoomHeapMux)).Unlock()
		Logger.Info("Released RoomHeapMux for player:", zap.Any("playerId", playerId))
	}()
	defer func() {
		if r := recover(); r != nil {
			Logger.Error("Recovered from: ", zap.Any("panic", r))
			signalToCloseConnOfThisPlayer(Constants.RetCode.UnknownError, "")
		}
	}()
	Logger.Info("Acquired RoomHeapMux for player:", zap.Any("playerId", playerId))
	// Logger.Info("The RoomHeapManagerIns has:", zap.Any("addr", fmt.Sprintf("%p", models.RoomHeapManagerIns)), zap.Any("size", len(*(models.RoomHeapManagerIns))))
	if hasBoundRoomId {
		if tmpPRoom, existent := (*models.RoomMapManagerIns)[int32(boundRoomId)]; existent {
			pRoom = tmpPRoom
			Logger.Info("Successfully got:\n", zap.Any("roomID", pRoom.Id), zap.Any("playerId", playerId))
			res := pRoom.ReAddPlayerIfPossible(pPlayer)
			if false == res {
				signalToCloseConnOfThisPlayer(Constants.RetCode.PlayerNotReAddableToRoom, fmt.Sprintf("ReAddPlayerIfPossible returns false for roomID == %v, playerId == %v!", pRoom.Id, playerId))
			}
		} else {
			signalToCloseConnOfThisPlayer(Constants.RetCode.LocallyNoSpecifiedRoom, fmt.Sprintf("Cannot get a (*Room) for PresumedBoundRoomId == %d, playerId == %v!", boundRoomId, playerId))
		}
	} else {
		defer func() {
			if pRoom != nil {
				heap.Push(models.RoomHeapManagerIns, pRoom)
				(models.RoomHeapManagerIns).Update(pRoom, pRoom.Score)
			}
			(models.RoomHeapManagerIns).PrintInOrder()
		}()
		pRoom = heap.Pop(models.RoomHeapManagerIns).(*models.Room)
		if nil == pRoom {
			signalToCloseConnOfThisPlayer(Constants.RetCode.LocallyNoAvailableRoom, fmt.Sprintf("Cannot pop a (*Room) for playerId == %v!", playerId))
		} else {
			Logger.Info("Successfully popped:\n", zap.Any("roomID", pRoom.Id), zap.Any("playerId", playerId))
			res := pRoom.AddPlayerIfPossible(pPlayer)
			if !res {
				signalToCloseConnOfThisPlayer(Constants.RetCode.PlayerNotReAddableToRoom, fmt.Sprintf("AddPlayerIfPossible returns false for roomID == %v, playerId == %v!", pRoom.Id, playerId))
			}
		}
	}

	if swapped := atomic.CompareAndSwapInt32(pConnHasBeenSignaledToClose, 1, 1); swapped {
		return
	}

	resp := wsResp{
		Ret:   int32(Constants.RetCode.Ok),
		EchoedMsgId: int32(0),
		Act:   "HeartbeatRequirements",
		Data: struct {
			IntervalToPing        int `json:"intervalToPing"`
			WillKickIfInactiveFor int `json:"willKickIfInactiveFor"`
			BoundRoomId           int `json:"boundRoomId"`
		}{Constants.Ws.IntervalToPing, Constants.Ws.WillKickIfInactiveFor, int(pRoom.Id)},
	}

	connIOMux.Lock()
	err = conn.WriteJSON(resp)
	connIOMux.Unlock()
	if err != nil {
		Logger.Error("HeartbeatRequirements resp not written:", zap.Any("playerId", playerId), zap.Error(err))
		signalToCloseConnOfThisPlayer(Constants.RetCode.UnknownError, fmt.Sprintf("HeartbeatRequirements resp not written to playerId == %v!", playerId))
	}

	// Starts the receiving loop against the client-side
	receivingLoopAgainstPlayer := func() error {
		defer func() {
			if r := recover(); r != nil {
				Logger.Warn("Goroutine `receivingLoopAgainstPlayer`, recovery spot#1, recovered from: ", zap.Any("panic", r))
			}
			Logger.Info("Goroutine `receivingLoopAgainstPlayer` is stopped for:", zap.Any("playerId", playerId), zap.Any("roomID", pRoom.Id))
		}()
		for {
			if swapped := atomic.CompareAndSwapInt32(pConnHasBeenSignaledToClose, 1, 1); swapped {
				return nil
			}

			// Tries to receive from client-side in a non-blocking manner.
			var pReq *wsReq
			pReq = new(wsReq)
			err := conn.ReadJSON(pReq)
			if err != nil {
				signalToCloseConnOfThisPlayer(Constants.RetCode.UnknownError, "")
				return nil
			}
			// startOrFeedHeartbeatWatchdog(conn)
			if pReq.Act == "PlayerUpsyncCmd" {
				immediatePlayerData := new(models.Player)
				json.Unmarshal([]byte(pReq.Data), immediatePlayerData)
				// Logger.Info("Unmarshalled `PlayerUpsyncCmd`:", zap.Any("immediatePlayerData", immediatePlayerData))
				if int(immediatePlayerData.Id) != playerId {
					// WARNING: This player is cheating!
					Logger.Warn("Player cheats in reporting its own identity:", zap.Any("playerId", playerId), zap.Any("immediatePlayerData.Id", immediatePlayerData.Id))
					signalToCloseConnOfThisPlayer(Constants.RetCode.PlayerCheating, "")
					return nil
				} else {
					utils.SendSafely(immediatePlayerData, pRoom.CmdFromPlayersChan)
				}
			} else {
				// Deliberately not responding to other `pReq.Act`s to avoid the use of `connIOMux` within `forwardingLoopAgainstBoundRoom`.
			}
		}
		return nil
	}

	// Starts the forwarding loop associated "(*pPlayer).boundRoom".
	forwardingLoopAgainstBoundRoom := func(dedicatedChanToForward <-chan string) error {
    defer func() {
			if r := recover(); r != nil {
				Logger.Error("Goroutine `forwardingLoopAgainstBoundRoom` recovery spot#1, recovered from: ")
			}
			Logger.Info("Goroutine `forwardingLoopAgainstBoundRoom` is stopped for:", zap.Any("playerId", playerId), zap.Any("roomID", pRoom.Id))
		}()
		for {
			if swapped := atomic.CompareAndSwapInt32(pConnHasBeenSignaledToClose, 1, 1); swapped {
				return nil
			}
			select {
			case typedRoomDownsyncFrame := <-dedicatedChanToForward:
				if "" == typedRoomDownsyncFrame {
					signalToCloseConnOfThisPlayer(Constants.RetCode.UnknownError, "")
					return nil
				}
				// Logger.Info("Goroutine `forwardingLoopAgainstBoundRoom` sending:", zap.Any("RoomDownsyncFrame", typedRoomDownsyncFrame), zap.Any("roomID", pRoom.Id), zap.Any("playerId", playerId))
        wsSendActionPb(conn, "RoomDownsyncFrame", typedRoomDownsyncFrame)
			default:
			}
		}
		return nil
	}
	startOrFeedHeartbeatWatchdog(conn)
	go forwardingLoopAgainstBoundRoom(pRoom.PlayerDownsyncChanDict[int32(playerId)])
	go receivingLoopAgainstPlayer()
}
