package models

type Position2D struct {
  X float64 `json:"x"`
  Y float64 `json:"y"`
}

type Polygon2D struct {
  Anchor *Position2D `json:"anchor"`
  OtherPoints []*Position2D `json:"otherPoints"`
}

type Vec2D struct {
  Dx float64 `json:"dx"`
  Dy float64 `json:"dy"`
}
