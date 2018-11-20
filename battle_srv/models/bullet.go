package models

import (
	"github.com/ByteArena/box2d"
)

type Bullet struct {
	LocalIdInBattle      int32    `protobuf:"varint,1,opt,name=localIdInBattle,proto3" json:"localIdInBattle,omitempty"`
	LinearSpeed          float64  `protobuf:"fixed64,2,opt,name=linearSpeed,proto3" json:"linearSpeed,omitempty"`
	ImmediatePosition    *Vec2D   `protobuf:"bytes,3,opt,name=immediatePosition,proto3" json:"immediatePosition,omitempty"`
	StartAtPoint         *Vec2D   `json:"-"`
	EndAtPoint           *Vec2D   `json:"-"`
  LinearUnitVector Vec2D        `json:"-"`
	DamageBoundary  *Polygon2D    `json:"-"`
	CollidableBody  *box2d.B2Body `json:"-"`
}
