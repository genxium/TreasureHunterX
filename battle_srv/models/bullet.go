package models

import (
	"github.com/ByteArena/box2d"
)

type Bullet struct {
	LocalIdInBattle  int32         `json:"localIdInBattle,omitempty"`
	LinearSpeed      float64       `json:"linearSpeed,omitempty"`
	X                float64       `json:"x,omitempty"`
	Y                float64       `json:"y,omitempty"`
	Removed          bool          `json:"removed,omitempty"`
	Dir              *Direction    `json:"-"`
	StartAtPoint     *Vec2D        `json:"startAtPoint,omitempty`
	EndAtPoint       *Vec2D        `json:"endAtPoint,omitempty`
	DamageBoundary   *Polygon2D    `json:"-"`
	CollidableBody   *box2d.B2Body `json:"-"`
	RemovedAtFrameId int32         `json:"-"`
}
