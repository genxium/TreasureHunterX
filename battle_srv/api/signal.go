package api

import (
  "net/http"
  "github.com/gin-gonic/gin"
)

const RET  = "ret"
const PLAYER_ID  = "playerId"
const TOKEN  = "token"

func CErr(c *gin.Context, err error) {
  if err != nil {
    c.Error(err)
  }
}


func HandleRet() gin.HandlerFunc {
  return func(c *gin.Context) {
    c.Next()
    ret := c.GetInt("ret")
    if ret != 0 {
      c.JSON(http.StatusOK, gin.H{"ret": ret})
    }
  }
}
