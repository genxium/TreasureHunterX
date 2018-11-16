package models

import (
	"github.com/ByteArena/box2d"
)

type TrapBullet struct {

	ID              int           `json:"id"`
	LocalIDInBattle int           `json:"localIDInBattle"`
  StartAtPoint    Vec2D         `json:"startAtPoint"`
  endAtPoint      Vec2D         `json:"endAtPoint"` 
	PickupBoundary  *Polygon2D    `json:"pickupBoundary"`
	CollidableBody  *box2d.B2Body `json:"-"`

}
