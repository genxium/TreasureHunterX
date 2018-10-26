package models

type Treasure struct {
  ID  int `json:"id"`
  LocalIDInBattle  int `json:"localIDInBattle"`
  Score  int `json:"score"`
  PickupBoundary *Polygon2D `json:"pickupBoundary"`
}
