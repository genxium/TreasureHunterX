package models

import (
	"encoding/xml"
  "math"
	"fmt"
  "strings"
  "strconv"
)

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

  ControlledPlayersInitPosList []Vec2D
  TreasuresInitPosList []Vec2D
}

type Tsx struct {
	Name         string           `xml:"name,attr"`
	TileWidth    int              `xml:"tilewidth,attr"`
	TileHeight   int              `xml:"tileheight,attr"`
	TileCount    int              `xml:"tilecount,attr"`
	Columns      int              `xml:"columns,attr"`
	Image        []TmxImage       `xml:"image"`
	Tiles        []TsxTile        `xml:"tile"`
  PolyLineList []TreasurePolyline
}

type TsxTile struct {
  Id           int           `xml:"id,attr"`
  ObjectGroup  TsxObjectGroup   `xml:"objectgroup"` 
}

type TsxObjectGroup struct{
  Draworder    string           `xml:"draworder,attr"`
  TsxObjects   []TsxObject      `xml:"object"`
}

type TsxObject struct {
  Id           int                  `xml:"id,attr"`
  X            float64              `xml:"x,attr"`
  Y            float64              `xml:"y,attr"`
	Properties   []TmxProperties      `xml:"properties"`
	Polyline     TsxPolyline          `xml:"polyline"`
}

type TmxProperties struct {
	Property []TmxProperty `xml:"property"`
}

type TsxPolyline struct {
	Points  string `xml:"points,attr"`
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

type TreasurePolyline struct {
  InitPos Vec2D
  Points []Vec2D 
}


func DeserializeToTsxIns(byteArr []byte, pTsxIns *Tsx) error {
	err := xml.Unmarshal(byteArr, pTsxIns)
  for _, tile := range pTsxIns.Tiles {
    if 7 == tile.Id {
      tileObjectGroup := tile.ObjectGroup
      pTsxIns.PolyLineList = make([]TreasurePolyline, len(tileObjectGroup.TsxObjects))
      for index, obj := range tileObjectGroup.TsxObjects {
        initPos := Vec2D{
          X: obj.X,
          Y: obj.Y,
        }
        fmt.Printf("%s\n",obj.Polyline.Points)
        singleValueArray := strings.Split(obj.Polyline.Points, " ")
        pointsArray := make([]Vec2D, len(singleValueArray))
        fmt.Printf("%v\n",singleValueArray)
        for key, value := range singleValueArray{
          for k, v := range strings.Split(value,","){
             n, err := strconv.ParseFloat(v, 64);
             if err != nil {
	               return err
             }
            if  k % 2 == 0{
              pointsArray[key].X = n
            }else {
              pointsArray[key].Y = n 
            }
          }
        }
        pTsxIns.PolyLineList[index] =  TreasurePolyline{
          InitPos: initPos,
          Points: pointsArray,
        } 
    }
  }
  }
	return err
}



func DeserializeToTmxMapIns(byteArr []byte, pTmxMapIns *TmxMap) error {
	err := xml.Unmarshal(byteArr, pTmxMapIns)
  fmt.Printf("%s\n",byteArr)
  for _, objGroup := range pTmxMapIns.ObjectGroups {
    if "controlled_players_starting_pos_list" == objGroup.Name {
      pTmxMapIns.ControlledPlayersInitPosList = make([]Vec2D, len(objGroup.Objects))
      for index, obj := range objGroup.Objects {
        tmp := Vec2D{
          X: obj.X,
          Y: obj.Y,
        }
        controlledPlayerStartingPos := pTmxMapIns.continuousObjLayerVecToContinuousMapNodeVec(&tmp)
        pTmxMapIns.ControlledPlayersInitPosList[index] = controlledPlayerStartingPos
      }
    }
    if "treasures" == objGroup.Name {
      pTmxMapIns.TreasuresInitPosList = make([]Vec2D, len(objGroup.Objects))
      for index, obj := range objGroup.Objects {
        tmp := Vec2D{
          X: obj.X,
          Y: obj.Y,
        }
        treasurePos := pTmxMapIns.continuousObjLayerVecToContinuousMapNodeVec(&tmp)
        pTmxMapIns.TreasuresInitPosList[index] = treasurePos
      }
    }
  }
	return err
}

func (pTmxMap *TmxMap) ToXML() (string, error) {
	ret, err := xml.Marshal(pTmxMap)
	return string(ret[:]), err
}

type TileRectilinearSize struct {
  Width float64
  Height float64
}

func (pTmxMapIns *TmxMap) continuousObjLayerVecToContinuousMapNodeVec(continuousObjLayerVec *Vec2D) Vec2D {
      var  tileRectilinearSize TileRectilinearSize
      tileRectilinearSize.Width = float64(pTmxMapIns.TileWidth)
      tileRectilinearSize.Height = float64(pTmxMapIns.TileHeight)
      tileSizeUnifiedLength := math.Sqrt(tileRectilinearSize.Width * tileRectilinearSize.Width * 0.25 + tileRectilinearSize.Height * tileRectilinearSize.Height * 0.25)
      isometricObjectLayerPointOffsetScaleFactor := (tileSizeUnifiedLength / tileRectilinearSize.Height);
  fmt.Printf("tileWidth = %d,tileHeight = %d\n", pTmxMapIns.TileWidth, pTmxMapIns.TileHeight)
      cosineThetaRadian := (tileRectilinearSize.Width * 0.5) / tileSizeUnifiedLength
      sineThetaRadian := (tileRectilinearSize.Height * 0.5) / tileSizeUnifiedLength

       transMat := [...][2]float64{
          {isometricObjectLayerPointOffsetScaleFactor * cosineThetaRadian, - isometricObjectLayerPointOffsetScaleFactor * cosineThetaRadian},
          {- isometricObjectLayerPointOffsetScaleFactor * sineThetaRadian, - isometricObjectLayerPointOffsetScaleFactor * sineThetaRadian},
        }
       convertedVecX := transMat[0][0] * continuousObjLayerVec.X + transMat[0][1] * continuousObjLayerVec.Y;
       convertedVecY := transMat[1][0] * continuousObjLayerVec.X + transMat[1][1] * continuousObjLayerVec.Y;
      var converted Vec2D
      converted.X = convertedVecX + 0
      converted.Y = convertedVecY + 0.5*float64(pTmxMapIns.Height * pTmxMapIns.TileHeight)
      return converted
}
