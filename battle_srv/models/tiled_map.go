package models

import (
	"encoding/xml"
	// "fmt"
	"bytes"
	"compress/zlib"
	"encoding/base64"
	"errors"
	"go.uber.org/zap"
	"io/ioutil"
	"math"
	. "server/common"
	"strconv"
	"strings"
)

const (
	HIGH_SCORE_TREASURE_SCORE = 200
	HIGH_SCORE_TREASURE_TYPE  = 2
	TREASURE_SCORE            = 100
	TREASURE_TYPE             = 1
	SPEED_SHOES_TYPE          = 3

	FLIPPED_HORIZONTALLY_FLAG uint32 = 0x80000000
	FLIPPED_VERTICALLY_FLAG   uint32 = 0x40000000
	FLIPPED_DIAGONALLY_FLAG   uint32 = 0x20000000
)

type TmxTile struct {
	Id             uint32
	Tileset        *TmxTileset
	FlipHorizontal bool
	FlipVertical   bool
	FlipDiagonal   bool
}

type TmxLayer struct {
	Name   string  `xml:"name,attr"`
	Width  int     `xml:"width,attr"`
	Height int     `xml:"height,attr"`
	Data   TmxData `xml:"data"`
	Tile   []*TmxTile
}

type TmxProperty struct {
	Name  string `xml:"name,attr"`
	Value string `xml:"value,attr"`
}

type TmxProperties struct {
	Property []TmxProperty `xml:"property"`
}

type TmxImage struct {
	Source string `xml:"source,attr"`
	Width  int    `xml:"width,attr"`
	Height int    `xml:"height,attr"`
}

// w tileSet
type TmxTileset struct {
	FirstGid   uint32     `xml:"firstgid,attr"` // w 此图块集的第一个图块在全局图块集中的位置
	Name       string     `xml:"name,attr"`
	TileWidth  int        `xml:"tilewidth,attr"`
	TileHeight int        `xml:"tileheight,attr"`
	Images     []TmxImage `xml:"image"`
	Source     string     `xml:"source,attr"`
}

type TmxObject struct {
	Id         string        `xml:"id,attr"`
	X          float64       `xml:"x,attr"`
	Y          float64       `xml:"y,attr"`
	Properties TmxProperties `xml:"properties"`
}

type TmxObjectGroup struct {
	Name    string      `xml:"name,attr"`
	Width   int         `xml:"width,attr"`
	Height  int         `xml:"height,attr"`
	Objects []TmxObject `xml:"object"`
}

// w map
type TmxMap struct {
	Version      string            `xml:"version,attr"`
	Orientation  string            `xml:"orientation,attr"`
	Width        int               `xml:"width,attr"`      // w 地图的宽度
	Height       int               `xml:"height,attr"`     // w 地图的高度（tile 个数）
	TileWidth    int               `xml:"tilewidth,attr"`  // w 单Tile的宽度
	TileHeight   int               `xml:"tileheight,attr"` // w 单Tile的高度
	Properties   []*TmxProperties  `xml:"properties"`
	Tilesets     []*TmxTileset     `xml:"tileset"`
	Layers       []*TmxLayer       `xml:"layer"`
	ObjectGroups []*TmxObjectGroup `xml:"objectgroup"`

	ControlledPlayersInitPosList []Vec2D
	TreasuresInfo                []TreasuresInfo
	HighTreasuresInfo            []TreasuresInfo
	SpeedShoesList               []SpeedShoesInfo
	TrapsInitPosList             []Vec2D
	Pumpkins                      []*Vec2D
}

type TreasuresInfo struct {
	InitPos Vec2D
	Type    int32
	Score   int32
}

type SpeedShoesInfo struct {
	InitPos Vec2D
	Type    int32
}

type Tsx struct {
	Name       string     `xml:"name,attr"`
	TileWidth  int        `xml:"tilewidth,attr"`
	TileHeight int        `xml:"tileheight,attr"`
	TileCount  int        `xml:"tilecount,attr"`
	Columns    int        `xml:"columns,attr"`
	Image      []TmxImage `xml:"image"`
	Tiles      []TsxTile  `xml:"tile"`

	HigherTreasurePolyLineList []*TmxPolyline
	LowTreasurePolyLineList    []*TmxPolyline
	TrapPolyLineList           []*TmxPolyline
	SpeedShoesPolyLineList     []*TmxPolyline
	BarrierPolyLineList        map[int]*TmxPolyline // w barrier polyline
}

type TsxTile struct {
	Id          int            `xml:"id,attr"`
	ObjectGroup TsxObjectGroup `xml:"objectgroup"`
	Properties  TmxProperties  `xml:"properties"`
}

type TsxObjectGroup struct {
	Draworder  string      `xml:"draworder,attr"`
	TsxObjects []TsxObject `xml:"object"`
}

type TsxObject struct {
	Id         int             `xml:"id,attr"`
	X          float64         `xml:"x,attr"`
	Y          float64         `xml:"y,attr"`
	Properties []TmxProperties `xml:"properties"`
	Polyline   TsxPolyline     `xml:"polyline"`
}

type TsxPolyline struct {
	Points string `xml:"points,attr"`
}

type TmxData struct {
	Encoding    string `xml:"encoding,attr"`
	Compression string `xml:"compression,attr"`
	Value       string `xml:",chardata"`
}

type TmxPolyline struct {
	InitPos *Vec2D
	Points  []*Vec2D
}

func (d *TmxData) decodeBase64() ([]byte, error) {
	r := bytes.NewReader([]byte(strings.TrimSpace(d.Value)))
	decr := base64.NewDecoder(base64.StdEncoding, r)
	if d.Compression == "zlib" {
		rclose, err := zlib.NewReader(decr)
		if err != nil {
			Logger.Error("tmx data decode zlib error: ", zap.Any("encoding", d.Encoding), zap.Any("compression", d.Compression), zap.Any("value", d.Value))
			return nil, err
		}
		return ioutil.ReadAll(rclose)
	}
	Logger.Error("tmx data decode invalid compression: ", zap.Any("encoding", d.Encoding), zap.Any("compression", d.Compression), zap.Any("value", d.Value))
	return nil, errors.New("invalid compression")
}

func (l *TmxLayer) decodeBase64() ([]uint32, error) {
	databytes, err := l.Data.decodeBase64()
	if err != nil {
		return nil, err
	}
	if l.Width == 0 || l.Height == 0 {
		return nil, errors.New("zero width or height")
	}
	if len(databytes) != l.Height*l.Width*4 {
		Logger.Error("TmxLayer decodeBase64 invalid data bytes:", zap.Any("width", l.Width), zap.Any("height", l.Height), zap.Any("data lenght", len(databytes)))
		return nil, errors.New("data length error")
	}
	dindex := 0
	gids := make([]uint32, l.Height*l.Width)
	for h := 0; h < l.Height; h++ {
		for w := 0; w < l.Width; w++ {
			gid := uint32(databytes[dindex]) |
				uint32(databytes[dindex+1])<<8 |
				uint32(databytes[dindex+2])<<16 |
				uint32(databytes[dindex+3])<<24
			dindex += 4
			gids[h*l.Width+w] = gid
		}
	}
	return gids, nil
}

func (m *TmxMap) getCoordByGid(index int) (x float64, y float64) {
	h := index / m.Width
	w := index % m.Width
	x = float64(w*m.TileWidth) + 0.5*float64(m.TileWidth)
	y = float64(h*m.TileHeight) + 0.5*float64(m.TileHeight)
	tmp := &Vec2D{x, y}
	vec2 := m.continuousObjLayerVecToContinuousMapNodeVec(tmp)
	return vec2.X, vec2.Y
}

func (m *TmxMap) decodeLayerGid() error {
	for _, layer := range m.Layers {
		gids, err := layer.decodeBase64()
		if err != nil {
			return err
		}
		tmxsets := make([]*TmxTile, len(gids))
		for index, gid := range gids {
			if gid == 0 {
				continue
			}
			flipHorizontal := (gid & FLIPPED_HORIZONTALLY_FLAG)
			flipVertical := (gid & FLIPPED_VERTICALLY_FLAG)
			flipDiagonal := (gid & FLIPPED_DIAGONALLY_FLAG)
			gid := gid & ^(FLIPPED_HORIZONTALLY_FLAG | FLIPPED_VERTICALLY_FLAG | FLIPPED_DIAGONALLY_FLAG)
			for i := len(m.Tilesets) - 1; i >= 0; i-- {
				if m.Tilesets[i].FirstGid <= gid {
					tmxsets[index] = &TmxTile{
						Id:             gid - m.Tilesets[i].FirstGid,
						Tileset:        m.Tilesets[i],
						FlipHorizontal: flipHorizontal > 0,
						FlipVertical:   flipVertical > 0,
						FlipDiagonal:   flipDiagonal > 0,
					}
					break
				}
			}
		}
		layer.Tile = tmxsets
	}
	return nil
}

func DeserializeToTsxIns(byteArr []byte, pTsxIns *Tsx) error {
	err := xml.Unmarshal(byteArr, pTsxIns)
	if err != nil {
		return err
	}
	pPolyLineMap := make(map[int]*TmxPolyline, 0)
	for _, tile := range pTsxIns.Tiles {
		if tile.Properties.Property != nil && tile.Properties.Property[0].Name == "type" {
			tileObjectGroup := tile.ObjectGroup
			pPolyLineList := make([]*TmxPolyline, len(tileObjectGroup.TsxObjects))
			for index, obj := range tileObjectGroup.TsxObjects {
				initPos := &Vec2D{
					X: obj.X,
					Y: obj.Y,
				}
				// fmt.Printf("%s\n",obj.Polyline.Points)
				singleValueArray := strings.Split(obj.Polyline.Points, " ")
				pointsArrayWrtInit := make([]Vec2D, len(singleValueArray))
				// fmt.Printf("%v\n",singleValueArray)
				for key, value := range singleValueArray {
					for k, v := range strings.Split(value, ",") {
						n, err := strconv.ParseFloat(v, 64)
						if err != nil {
							return err
						}
						if k%2 == 0 {
							pointsArrayWrtInit[key].X = n + initPos.X
						} else {
							pointsArrayWrtInit[key].Y = n + initPos.Y
						}
					}
				}
				pointsArrayTransted := make([]*Vec2D, len(pointsArrayWrtInit))
				var scale float64 = 0.5
				for key, value := range pointsArrayWrtInit {
					pointsArrayTransted[key] = &Vec2D{X: value.X - scale*float64(pTsxIns.TileWidth), Y: scale*float64(pTsxIns.TileHeight) - value.Y}
				}
				pPolyLineList[index] = &TmxPolyline{
					InitPos: initPos,
					Points:  pointsArrayTransted,
				}
				for _, pros := range obj.Properties {
					for _, p := range pros.Property {
						if p.Value == "barrier" {
							pPolyLineMap[tile.Id] = pPolyLineList[index]
						}
					}
				}
			}
			if tile.Properties.Property[0].Value == "highScoreTreasure" {
				pTsxIns.HigherTreasurePolyLineList = pPolyLineList
			} else if tile.Properties.Property[0].Value == "lowScoreTreasure" {
				pTsxIns.LowTreasurePolyLineList = pPolyLineList
			} else if "trap" == tile.Properties.Property[0].Value {
				pTsxIns.TrapPolyLineList = pPolyLineList
			} else if "speedShoes" == tile.Properties.Property[0].Value {
				pTsxIns.SpeedShoesPolyLineList = pPolyLineList
			}
			pTsxIns.BarrierPolyLineList = pPolyLineMap
		}
	}
	return nil
}

func DeserializeToTmxMapIns(byteArr []byte, pTmxMapIns *TmxMap) error {
	err := xml.Unmarshal(byteArr, pTmxMapIns)
	if err != nil {
		return err
	}
	// fmt.Printf("%s\n", byteArr)
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

		if "highTreasures" == objGroup.Name {
			pTmxMapIns.HighTreasuresInfo = make([]TreasuresInfo, len(objGroup.Objects))
			for index, obj := range objGroup.Objects {
				tmp := Vec2D{
					X: obj.X,
					Y: obj.Y,
				}
				treasurePos := pTmxMapIns.continuousObjLayerVecToContinuousMapNodeVec(&tmp)
				pTmxMapIns.HighTreasuresInfo[index].Score = HIGH_SCORE_TREASURE_SCORE
				pTmxMapIns.HighTreasuresInfo[index].Type = HIGH_SCORE_TREASURE_TYPE
				pTmxMapIns.HighTreasuresInfo[index].InitPos = treasurePos
			}
		}
		if "treasures" == objGroup.Name {
			pTmxMapIns.TreasuresInfo = make([]TreasuresInfo, len(objGroup.Objects))
			for index, obj := range objGroup.Objects {
				tmp := Vec2D{
					X: obj.X,
					Y: obj.Y,
				}
				treasurePos := pTmxMapIns.continuousObjLayerVecToContinuousMapNodeVec(&tmp)
				pTmxMapIns.TreasuresInfo[index].Score = TREASURE_SCORE
				pTmxMapIns.TreasuresInfo[index].Type = TREASURE_TYPE
				pTmxMapIns.TreasuresInfo[index].InitPos = treasurePos
			}
		}

		if "traps" == objGroup.Name {
			pTmxMapIns.TrapsInitPosList = make([]Vec2D, len(objGroup.Objects))
			for index, obj := range objGroup.Objects {
				tmp := Vec2D{
					X: obj.X,
					Y: obj.Y,
				}
				trapPos := pTmxMapIns.continuousObjLayerVecToContinuousMapNodeVec(&tmp)
				pTmxMapIns.TrapsInitPosList[index] = trapPos
			}
		}
		if "pumpkins" == objGroup.Name {
			pTmxMapIns.Pumpkins = make([]*Vec2D, len(objGroup.Objects))
			for index, obj := range objGroup.Objects {
				tmp := Vec2D{
					X: obj.X,
					Y: obj.Y,
				}
				pos := pTmxMapIns.continuousObjLayerVecToContinuousMapNodeVec(&tmp)
				pTmxMapIns.Pumpkins[index] = &pos
			}
		}
		Logger.Info("pumpkinInfo", zap.Any("p:", pTmxMapIns.Pumpkins))
		if "speed_shoes" == objGroup.Name {
			pTmxMapIns.SpeedShoesList = make([]SpeedShoesInfo, len(objGroup.Objects))
			for index, obj := range objGroup.Objects {
				tmp := Vec2D{
					X: obj.X,
					Y: obj.Y,
				}
				pos := pTmxMapIns.continuousObjLayerVecToContinuousMapNodeVec(&tmp)
				pTmxMapIns.SpeedShoesList[index].Type = SPEED_SHOES_TYPE
				pTmxMapIns.SpeedShoesList[index].InitPos = pos
			}
		}
	}
	return pTmxMapIns.decodeLayerGid()
}

func (pTmxMap *TmxMap) ToXML() (string, error) {
	ret, err := xml.Marshal(pTmxMap)
	return string(ret[:]), err
}

type TileRectilinearSize struct {
	Width  float64
	Height float64
}

func (pTmxMapIns *TmxMap) continuousObjLayerVecToContinuousMapNodeVec(continuousObjLayerVec *Vec2D) Vec2D {
	var tileRectilinearSize TileRectilinearSize
	tileRectilinearSize.Width = float64(pTmxMapIns.TileWidth)
	tileRectilinearSize.Height = float64(pTmxMapIns.TileHeight)
	tileSizeUnifiedLength := math.Sqrt(tileRectilinearSize.Width*tileRectilinearSize.Width*0.25 + tileRectilinearSize.Height*tileRectilinearSize.Height*0.25)
	isometricObjectLayerPointOffsetScaleFactor := (tileSizeUnifiedLength / tileRectilinearSize.Height)
	// fmt.Printf("tileWidth = %d,tileHeight = %d\n", pTmxMapIns.TileWidth, pTmxMapIns.TileHeight)
	cosineThetaRadian := (tileRectilinearSize.Width * 0.5) / tileSizeUnifiedLength
	sineThetaRadian := (tileRectilinearSize.Height * 0.5) / tileSizeUnifiedLength

	transMat := [...][2]float64{
		{isometricObjectLayerPointOffsetScaleFactor * cosineThetaRadian, -isometricObjectLayerPointOffsetScaleFactor * cosineThetaRadian},
		{-isometricObjectLayerPointOffsetScaleFactor * sineThetaRadian, -isometricObjectLayerPointOffsetScaleFactor * sineThetaRadian},
	}
	convertedVecX := transMat[0][0]*continuousObjLayerVec.X + transMat[0][1]*continuousObjLayerVec.Y
	convertedVecY := transMat[1][0]*continuousObjLayerVec.X + transMat[1][1]*continuousObjLayerVec.Y
	var converted Vec2D
	converted.X = convertedVecX + 0
	converted.Y = convertedVecY + 0.5*float64(pTmxMapIns.Height*pTmxMapIns.TileHeight)
	return converted
}
