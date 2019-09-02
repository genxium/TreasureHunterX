package models

import (
	"bytes"
	"compress/zlib"
	"encoding/base64"
	"encoding/xml"
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

// For either a "*.tmx" or "*.tsx" file. [begins]
type TmxOrTsxProperty struct {
	Name  string `xml:"name,attr"`
	Value string `xml:"value,attr"`
}

type TmxOrTsxProperties struct {
	Property []*TmxOrTsxProperty `xml:"property"`
}

type TmxOrTsxPolyline struct {
	Points string `xml:"points,attr"`
}

type TmxOrTsxObject struct {
	Id         int                   `xml:"id,attr"`
	X          float64               `xml:"x,attr"`
	Y          float64               `xml:"y,attr"`
	Properties []*TmxOrTsxProperties `xml:"properties"`
	Polyline   *TmxOrTsxPolyline     `xml:"polyline"`
}

type TmxOrTsxObjectGroup struct {
	Draworder string            `xml:"draworder,attr"`
	Name      string            `xml:"name,attr"`
	Objects   []*TmxOrTsxObject `xml:"object"`
}

// For either a "*.tmx" or "*.tsx" file. [ends]

// Within a "*.tsx" file. [begins]
type Tsx struct {
	Name       string      `xml:"name,attr"`
	TileWidth  int         `xml:"tilewidth,attr"`
	TileHeight int         `xml:"tileheight,attr"`
	TileCount  int         `xml:"tilecount,attr"`
	Columns    int         `xml:"columns,attr"`
	Image      []*TmxImage `xml:"image"`
	Tiles      []*TsxTile  `xml:"tile"`
}

type TsxTile struct {
	Id          int                  `xml:"id,attr"`
	ObjectGroup *TmxOrTsxObjectGroup `xml:"objectgroup"`
	Properties  *TmxOrTsxProperties  `xml:"properties"`
}

// Within a "*.tsx" file. [ends]

// Within a "*.tmx" file. [begins]
type TmxLayerDecodedTileData struct {
	Id             uint32
	Tileset        *TmxTileset
	FlipHorizontal bool
	FlipVertical   bool
	FlipDiagonal   bool
}

type TmxLayerEncodedData struct {
	Encoding    string `xml:"encoding,attr"`
	Compression string `xml:"compression,attr"`
	Value       string `xml:",chardata"`
}

type TmxLayer struct {
	Name   string               `xml:"name,attr"`
	Width  int                  `xml:"width,attr"`
	Height int                  `xml:"height,attr"`
	Data   *TmxLayerEncodedData `xml:"data"`
	Tile   []*TmxLayerDecodedTileData
}

type TmxImage struct {
	Source string `xml:"source,attr"`
	Width  int    `xml:"width,attr"`
	Height int    `xml:"height,attr"`
}

type TmxTileset struct {
	FirstGid   uint32     `xml:"firstgid,attr"`
	Name       string     `xml:"name,attr"`
	TileWidth  int        `xml:"tilewidth,attr"`
	TileHeight int        `xml:"tileheight,attr"`
	Images     []TmxImage `xml:"image"`
	Source     string     `xml:"source,attr"`
}

type TmxMap struct {
	Version      string                `xml:"version,attr"`
	Orientation  string                `xml:"orientation,attr"`
	Width        int                   `xml:"width,attr"`
	Height       int                   `xml:"height,attr"`
	TileWidth    int                   `xml:"tilewidth,attr"`
	TileHeight   int                   `xml:"tileheight,attr"`
	Properties   []*TmxOrTsxProperties `xml:"properties"`
	Tilesets     []*TmxTileset         `xml:"tileset"`
	Layers       []*TmxLayer           `xml:"layer"`
	ObjectGroups []*TmxObjectGroup     `xml:"objectgroup"`

	ControlledPlayersInitPosList []*Vec2D
	LowTreasureInfoList          []*TreasureInfo
	HighTreasureInfoList         []*TreasureInfo
	SpeedShoeInfoList            []*SpeedShoeInfo
	TrapsInitPosList             []*Vec2D
	GuardTowersInitPosList       []*Vec2D
	PumpkinPosList               []*Vec2D
}

// Within a "*.tmx" file. [ends]

type TreasureInfo struct {
	InitPos Vec2D
	Type    int32
	Score   int32
}

type SpeedShoeInfo struct {
	InitPos Vec2D
	Type    int32
}

func (d *TmxLayerEncodedData) decodeBase64() ([]byte, error) {
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

type Polygon2DList []*Polygon2D

func DeserializeTsxToColliderDict(byteArr []byte, firstGid int, gidBoundariesMap map[string]Polygon2DList) error {
	pTsxIns := &Tsx{}
	err := xml.Unmarshal(byteArr, pTsxIns)
	if nil != err {
		return err
	}

	var factorHalf float64 = 0.5

	for _, tile := range pTsxIns.Tiles {
		globalGid := (firstGid + tile.Id)
		/**
				   Per tile xml str could be

				   ```
				   <tile id="13">
				    <objectgroup draworder="index">
				     <object id="1" x="-154" y="-159">
		          <properties>
		           <property name="type" value="guardTower"/>
		          </properties>
				      <polyline points="0,0 -95,179 18,407 361,434 458,168 333,-7"/>
				     </object>
				    </objectgroup>
				   </tile>
				   ```
				   , we currently REQUIRE that "`an object of a tile` with ONE OR MORE polylines must come with a single corresponding '<property name=`type` value=`...` />', and viceversa".

				  Refer to https://shimo.im/docs/SmLJJhXm2C8XMzZT for how we theoretically fit a "Polyline in Tsx" into a "Polygon2D" and then into the corresponding "B2BodyDef & B2Body in the `world of colliding bodies`".
		*/

		theObjGroup := tile.ObjectGroup
		for _, singleObj := range theObjGroup.Objects {
			if nil == singleObj.Polyline {
				// Temporarily omit those non-polyline-containing objects.
				continue
			}
			if nil == singleObj.Properties.Property || "type" != singleObj.Properties.Property[0].Name {
				continue
			}
			key := singleObj.Properties.Property[0].Value

			var thePolygon2DList Polygon2DList
			if existingPolygon2DList, ok := gidBoundariesMap[globalGid]; ok {
				thePolygon2DList = existingPolygon2DList
			} else {
				thePolygon2DList = make(Polygon2DList, 0)
			}

			offsetFromTopLeftInTileLocalCoordX := singleObj.X
			offsetFromTopLeftInTileLocalCoordY := singleObj.Y

			singleValueArray := strings.Split(obj.Polyline.Points, " ")

			thePolygon2DFromPolyline := &Polygon2D{
				Anchor: nil,
				Points: make([]*Vec2D, len(singleValueArray)),
			}

			for k, value := range singleValueArray {
				for k, v := range strings.Split(value, ",") {
					coordinateValue, err := strconv.ParseFloat(v, 64)
					if nil != err {
						return err
					}
					if 0 == (k % 2) {
						thePolygon2DFromPolyline.Points[k].X = (coordinateValue + offsetFromTopLeftInTileLocalCoordX) - factorHalf*float64(pTsxIns.TileWidth)
					} else {
						thePolygon2DFromPolyline.Points[k].Y = factorHalf*float64(pTsxIns.TileHeight) - (coordinateValue + offsetFromTopLeftInTileLocalCoordY)
					}
				}
			}

			thePolygon2DList = append(thePolygon2DList, thePolygon2DFromPolyline)
		}
	}
	return nil
}

func ParseTmxLayersAndGroups(pTmxMapIns *TmxMap, gidBoundariesMap map[string]Polygon2DList) error {
	for _, objGroup := range pTmxMapIns.ObjectGroups {
		correspondingPolygon2DList := gidBoundariesMap[objGroup.Name]

		switch objGroup.Name {
		case "ControlledPlayerStartingPos":
		case "Barrier":
		case "LowScoreTreasure", "HighScoreTreasure", "GuardTower", "SpeedShoe", "Pumpkin":
		default:
		}
	}
	return
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
