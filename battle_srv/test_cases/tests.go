package main

import (
	. "server/common"
	"path/filepath"
	"server/models"
	"io/ioutil"
  "os"
	"fmt"
	"go.uber.org/zap"
)

var relativePath string

func loadTMX(fp string, v interface{}) {
	if !filepath.IsAbs(fp) {
    panic("Tmx filepath must be absolute!")
	}

  byteArr, err := ioutil.ReadFile(fp)
  ErrFatal(err)
  pTmxMapIns := v.(*models.TmxMap)
  models.LoadTMX(byteArr, pTmxMapIns)
  continuousObjLayerVecToContinuousMap(pTmxMapIns)  
}

func continuousObjLayerVecToContinuousMap(pTmxMapIns *models.TmxMap) {
  for _, objGroup := range pTmxMapIns.ObjectGroups {
    if "controlled_players_starting_pos_list" != objGroup.Name {
      continue
    }
    Logger.Info("objGroup named controlled_players_starting_pos_list", zap.Any("group", objGroup))
    for _, obj := range objGroup.Objects {
      tmp := models.Vec2D{
        X: obj.X,
        Y: obj.Y,
      }
      controlledPlayerStartingPos := continuousObjLayerVecToContinuousMapNodeVec(&tmp)
      Logger.Info("coverted", zap.Any("controlledPlayerStartingPos", controlledPlayerStartingPos))
    }
  }
}

type TileRectilinearSize struct {
  Width float64 
  Height float64
}
func continuousObjLayerVecToContinuousMapNodeVec(continuousObjLayerVec *models.Vec2D) models.Vec2D {
      var  tileRectilinearSize TileRectilinearSize
       tileRectilinearSize.Width = 128.00
       tileRectilinearSize.Height = 64.00
       transMat := [...][2]float64{
          {1,-1},{-0.5,-0.5},
        }
       convertedVecX := transMat[0][0] * continuousObjLayerVec.X + transMat[0][1] * continuousObjLayerVec.Y;
       convertedVecY := transMat[1][0] * continuousObjLayerVec.X + transMat[1][1] * continuousObjLayerVec.Y;
      var converted models.Vec2D
      converted.X = convertedVecX+0 
      converted.Y = convertedVecY+1600
      return converted
}
func main() {
  relativePath = "../../frontend/assets/resources/treasurehunter_1107_v2/treasurehunter.tmx" 
	execPath, err := os.Executable()
	ErrFatal(err)

	pwd, err := os.Getwd()
	ErrFatal(err)

  fmt.Printf("execPath = %v, pwd = %s, returning...\n", execPath, pwd)

  tmxMapIns := models.TmxMap{}
  pTmxMapIns := &tmxMapIns
  fp := filepath.Join(pwd, relativePath)
  fmt.Printf("fp == %v\n", fp)
  loadTMX(fp, pTmxMapIns)
}
