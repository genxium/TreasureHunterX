package models

import (
	"github.com/ByteArena/box2d"
)

type Treasure struct {

	ID              int           `json:"id"`
	LocalIDInBattle int           `json:"localIDInBattle"`
	Score           int           `json:"score"`
	PickupBoundary  *Polygon2D    `json:"pickupBoundary"`
	CollidableBody  *box2d.B2Body `json:"-"`

}
