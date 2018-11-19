package models

import (
	"github.com/ByteArena/box2d"
)

type Trap struct {
	ID              int           `json:"id"`
	LocalIDInBattle int           `json:"localIDInBattle"`
	Type            int           `json:"type"`
  TrapBullets     []Bullet  `json:"trapBullets"` 
	PickupBoundary  *Polygon2D    `json:"pickupBoundary"`
	CollidableBody  *box2d.B2Body `json:"-"`
}
