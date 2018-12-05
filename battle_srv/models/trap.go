package models

import (
	"github.com/ByteArena/box2d"
)

type Trap struct {
	Id               int32         `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	LocalIdInBattle  int32         `protobuf:"varint,2,opt,name=localIdInBattle,proto3" json:"localIdInBattle,omitempty"`
	Type             int32         `protobuf:"varint,3,opt,name=type,proto3" json:"type,omitempty"`
	X                float64       `protobuf:"fixed64,4,opt,name=x,proto3" json:"x,omitempty"`
	Y                float64       `protobuf:"fixed64,5,opt,name=y,proto3" json:"y,omitempty"`
	Removed          bool          `protobuf:"varint,6,opt,name=removed,proto3" json:"removed,omitempty"`
	PickupBoundary   *Polygon2D    `json:"-"`
	TrapBullets      []*Bullet     `json:"-"`
	CollidableBody   *box2d.B2Body `json:"-"`
	RemovedAtFrameId int32         `json:"-"`
}
