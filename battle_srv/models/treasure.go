package models

import (
	"github.com/ByteArena/box2d"
)

type Treasure struct {
	Id                   int32      `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	LocalIdInBattle      int32      `protobuf:"varint,2,opt,name=localIdInBattle,proto3" json:"localIdInBattle,omitempty"`
	Score                int32      `protobuf:"varint,3,opt,name=score,proto3" json:"score,omitempty"`
	PickupBoundary       *Polygon2D `protobuf:"bytes,4,opt,name=pickupBoundary,proto3" json:"pickupBoundary,omitempty"`
	CollidableBody  *box2d.B2Body `json:"-"`
}
