package models

import (
	"github.com/ByteArena/box2d"
)

type Trap struct {
	Id                   int32      `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	LocalIdInBattle      int32      `protobuf:"varint,2,opt,name=localIdInBattle,proto3" json:"localIdInBattle,omitempty"`
	Type                 int32      `protobuf:"varint,3,opt,name=type,proto3" json:"type,omitempty"`
	PickupBoundary       *Polygon2D `protobuf:"bytes,4,opt,name=pickupBoundary,proto3" json:"pickupBoundary,omitempty"`
	TrapBullets          []*Bullet  `json:"-"`
	CollidableBody    *box2d.B2Body `json:"-"`
}

