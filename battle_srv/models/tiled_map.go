package models

import (
	"encoding/xml"
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
	X      int    `xml:"x,attr"`
	Y      int    `xml:"y,attr"`
	Width  int    `xml:"width,attr"`
	Height int    `xml:"height,attr"`
}

func LoadTMX(byteArr []byte, pTmxMap *TmxMap) error {
	err := xml.Unmarshal(byteArr, pTmxMap)
	return err
}

func (pTmxMap *TmxMap) ToXML() (string, error) {
	ret, err := xml.Marshal(pTmxMap)
	return string(ret[:]), err
}
