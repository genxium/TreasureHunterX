package models

type Vec2D struct {
  X float64 `json:"x"`
  Y float64 `json:"y"`
}

type Polygon2D struct {
  // Using coordinates under the "MapNode".
  Anchor *Vec2D   `json:"anchor"`
  Points []*Vec2D `json:"points"`
}



