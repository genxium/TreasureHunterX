package models

import (
  "github.com/ByteArena/box2d"
)

type Vec2D struct {
  X float64 `json:"x"`
  Y float64 `json:"y"`
}

func CreateVec2DFromB2Vec2 (b2V2 box2d.B2Vec2) *Vec2D {
  return &Vec2D{
    X: b2V2.X,
    Y: b2V2.Y,
  }
}

func (v2 *Vec2D) ToB2Vec2() box2d.B2Vec2 {
  return box2d.MakeB2Vec2(v2.X, v2.Y)
}

type Polygon2D struct {
  // Using coordinates under the "MapNode".
  Anchor *Vec2D   `json:"anchor"`
  Points []*Vec2D `json:"points"`
}



