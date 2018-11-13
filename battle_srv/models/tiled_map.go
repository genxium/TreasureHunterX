package models

import (
	. "server/common"
	"path/filepath"
	"io/ioutil"
  "os"
	"fmt"
	"go.uber.org/zap"
	"encoding/xml"
  "math"
)

var relativePath string
type TmxMap struct {
	Version      string           `xml:"version,attr"`
	Orientation  string           `xml:"orientation,attr"`
	Width        int              `xml:"width,attr"`
	Height       int              `xml:"height,attr"`
	TileWidth    int              `xml:"tilewidth,attr"`
	TileHeight   int              `xml:"tileheight,attr"`
	Properties   []TmxProperties  `xml:"properties"`
	Tilesets     []TmxTileset     `xml:"tileset"`
	Layers       []TmxLayer       `xml:"layer"`
	ObjectGroups []TmxObjectGroup `xml:"objectgroup"`
}

type TmxProperties struct {
	Property []TmxProperty `xml:"property"`
}

type TmxProperty struct {
	Name  string `xml:"name,attr"`
	Value string `xml:"value,attr"`
}

type TmxTileset struct {
	FirstGid   int        `xml:"firstgid,attr"`
	Name       string     `xml:"name,attr"`
	TileWidth  int        `xml:"tilewidth,attr"`
	TileHeight int        `xml:"tileheight,attr"`
	Images     []TmxImage `xml:"image"`
}

type TmxImage struct {
	Source string `xml:"source,attr"`
	Width  int    `xml:"width,attr"`
	Height int    `xml:"height,attr"`
}

type TmxLayer struct {
	Name   string  `xml:"name,attr"`
	Width  int     `xml:"width,attr"`
	Height int     `xml:"height,attr"`
	Data   TmxData `xml:"data"`
}

type TmxData struct {
	Encoding string `xml:"encoding,attr"`
	Value    string `xml:",chardata"`
}

type TmxObjectGroup struct {
	Name    string      `xml:"name,attr"`
	Width   int         `xml:"width,attr"`
	Height  int         `xml:"height,attr"`
	Objects []TmxObject `xml:"object"`
}

type TmxObject struct {
	Type   string `xml:"type,attr"`
	X      float64    `xml:"x,attr"`
	Y      float64    `xml:"y,attr"`
	Width  int    `xml:"width,attr"`
	Height int    `xml:"height,attr"`
}

func LoadTMX(byteArr []byte,pTmxMap *TmxMap) error {
	err := xml.Unmarshal(byteArr,pTmxMap)
	return err
}

func (pTmxMap *TmxMap) ToXML() (string, error) {
	ret, err := xml.Marshal(pTmxMap)
	return string(ret[:]), err
}

func loadTMX(playerIndex int) Vec2D{
  relativePath = "../frontend/assets/resources/treasurehunter_1107_v2/treasurehunter.tmx" 
	execPath, err := os.Executable()
	ErrFatal(err)

	pwd, err := os.Getwd()
	ErrFatal(err)

  fmt.Printf("execPath = %v, pwd = %s, returning...\n", execPath, pwd)

  fp := filepath.Join(pwd, relativePath)
  fmt.Printf("fp == %v\n", fp)
	if !filepath.IsAbs(fp) {
    panic("Tmx filepath must be absolute!")
	}

  byteArr, err := ioutil.ReadFile(fp)
  ErrFatal(err)
  tmxMapIns := TmxMap{}
  pTmxMapIns := &tmxMapIns
  LoadTMX(byteArr, pTmxMapIns)
  return ContinuousObjLayerVecToContinuousMap(pTmxMapIns, playerIndex)
}

func ContinuousObjLayerVecToContinuousMap(pTmxMapIns *TmxMap, playerIndex int) Vec2D{
  var controlledPlayerStartingPos Vec2D
  for _, objGroup := range pTmxMapIns.ObjectGroups {
    if "controlled_players_starting_pos_list" != objGroup.Name {
      continue
    }
    Logger.Info("objGroup named controlled_players_starting_pos_list", zap.Any("group", objGroup))
    obj := objGroup.Objects[playerIndex]
      tmp := Vec2D{
        X: obj.X,
        Y: obj.Y,
      }
      controlledPlayerStartingPos = continuousObjLayerVecToContinuousMapNodeVec(&tmp)
      Logger.Info("controlledPlayerStartingPos", zap.Any("controlledPlayerStartingPos", controlledPlayerStartingPos))
    }
   return controlledPlayerStartingPos
}

type TileRectilinearSize struct {
  Width float64 
  Height float64
}
func continuousObjLayerVecToContinuousMapNodeVec(continuousObjLayerVec *Vec2D) Vec2D {
      var  tileRectilinearSize TileRectilinearSize
      tileRectilinearSize.Width = 64.00
      tileRectilinearSize.Height = 64.00
      tileSizeUnifiedLength := math.Sqrt(tileRectilinearSize.Width * tileRectilinearSize.Width * 0.25 + tileRectilinearSize.Height * tileRectilinearSize.Height * 0.25)
      isometricObjectLayerPointOffsetScaleFactor := (tileSizeUnifiedLength / tileRectilinearSize.Height);

      cosineThetaRadian := (tileRectilinearSize.Width * 0.5) / tileSizeUnifiedLength
      sineThetaRadian := (tileRectilinearSize.Height * 0.5) / tileSizeUnifiedLength

       transMat := [...][2]float64{
          {isometricObjectLayerPointOffsetScaleFactor * cosineThetaRadian, - isometricObjectLayerPointOffsetScaleFactor * cosineThetaRadian},
          {- isometricObjectLayerPointOffsetScaleFactor * sineThetaRadian, - isometricObjectLayerPointOffsetScaleFactor * sineThetaRadian},
        }
       convertedVecX := transMat[0][0] * continuousObjLayerVec.X + transMat[0][1] * continuousObjLayerVec.Y;
       convertedVecY := transMat[1][0] * continuousObjLayerVec.X + transMat[1][1] * continuousObjLayerVec.Y;
      var converted Vec2D
      converted.X = convertedVecX+0 
      converted.Y = convertedVecY+6400
      return converted
}
