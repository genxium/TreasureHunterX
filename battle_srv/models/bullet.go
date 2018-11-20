package models

import (
	"github.com/ByteArena/box2d"
)

type Bullet struct {
	LocalIDInBattle int           `json:"localIDInBattle"`
  LinearSpeed     float64           `json:"linearSpeed"`
  ImmediatePosition Vec2D       `json:"immediatePosition"`
  StartAtPoint    Vec2D         `json:"startAtPoint"`
  EndAtPoint      Vec2D         `json:"endAtPoint"`
  SendAt          int64         `json:"sendAt"` 
  DestinateDuration   float64     `json:"duration"` 
  LinearUnitVector Vec2D        `json:"-"`
	DamageBoundary  *Polygon2D    `json:"-"`
	CollidableBody  *box2d.B2Body `json:"-"`
}
