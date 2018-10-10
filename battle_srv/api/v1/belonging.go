package v1

import (
  "net/http"
  "server/api"
  . "server/common"
  "server/models"

  "github.com/gin-gonic/gin"
  "github.com/gin-gonic/gin/binding"
  "go.uber.org/zap"
)

var Belonging = belongingController{}

type belongingController struct {
}

type belongingFetchReq struct {
  RestaurantId int    `form:"targetRestaurantId"`
}

type point struct {
  X float32 `json:"x"`
  Y float32 `json:"y"`
}
type boundary struct {
  BoundaryType               int    `json:"boundary_type"`
  CounterclockwisePoints     string `json:"counterclockwise_points"`
  FirstPointOffsetFromAnchor point `json:"first_point_offset_from_anchor"`
}

type belonging struct {
  Anchor point `json:"anchor"`
  Boundaries []*boundary `json:"boundaries"`
  Gid int `json:"gid"`
  PlayerBelongingBindingID int `json:"player_belonging_binding_id"`
}

type belongingFetchResp struct {
  Ret                int `json:"ret"`
  TargetPlayerId     int `json:"targetPlayerId"`
  TargetRestaurantId int `json:"targetRestaurantId"`
  Belongings         []*belonging `json:"belongings"`
}

func (p *belongingController) Fetch(c *gin.Context) {
  req := belongingFetchReq{}
  err := c.ShouldBindWith(&req, binding.FormPost)
  if err != nil {
    c.Set(api.RET, Constants.RetCode.InvalidRequestParam)
    return
  }
  playerId := c.GetInt(api.PLAYER_ID)
  playerBelongingBindingList, err := models.GetPlayerBelongingBindingByPIDAndRID(playerId, req.RestaurantId)
  if err != nil {
    api.CErr(c, err)
    c.Set(api.RET, Constants.RetCode.MysqlError)
    return
  }
  resp := belongingFetchResp{Ret:Constants.RetCode.Ok, TargetPlayerId:playerId,
  TargetRestaurantId:req.RestaurantId,}
  resp.Belongings = make([]*belonging, 0, len(playerBelongingBindingList))
  for _, v := range playerBelongingBindingList {
    Logger.Debug("belonging", zap.Any("v", v))
    b := new(belonging)
    b.Anchor = point{v.AnchorX, v.AnchorY}
    b.PlayerBelongingBindingID = v.ID
    gid, err := models.GetBelongingGid(v.ID)
    api.CErr(c, err)
    if gid == 0 {
      continue
    }
    b.Gid = gid
    boundaries, err := models.GetBelongingBoundaryBindingByBID(v.ID)
    if err != nil {
      api.CErr(c, err)
      continue
    }
    b.Boundaries = make([]*boundary, len(boundaries))
    for j, v2 := range boundaries {
      b.Boundaries[j] = new(boundary)
      b.Boundaries[j].BoundaryType = v2.BoundaryType
      b.Boundaries[j].CounterclockwisePoints = v2.CounterclockwisePoints
      b.Boundaries[j].FirstPointOffsetFromAnchor = point{v2.FirstPointOffsetFromAnchorX,
      v2.FirstPointOffsetFromAnchorY}
    }
    resp.Belongings = append(resp.Belongings, b)
  }

  c.JSON(http.StatusOK, resp)
}
