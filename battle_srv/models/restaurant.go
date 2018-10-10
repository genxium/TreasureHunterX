package models

import (
  "github.com/jmoiron/sqlx"
  sq "github.com/Masterminds/squirrel"
)

type Restaurant struct {
  DisplayName string `json:"display_name" db:"display_name"`
  GeomapID    int    `json:"geomap_id" db:"geomap_id"`
  ID          int    `json:"id" db:"id"`
}

func GetAllRestaurantByMapId(id int) ([]*Restaurant, error) {
  var ls []*Restaurant
  err := getList("restaurant", sq.Eq{"geomap_id": id}, &ls)
  return ls, err
}

func (r *Restaurant) Insert(tx *sqlx.Tx) error{
	result, err := txInsert(tx, "restaurant",[]string{"display_name, geomap_id"},[]interface{}{r.DisplayName,r.GeomapID})
  if err != nil { 
		return err
  }
  id, err := result.LastInsertId()
  if err != nil {
    return err
  }
  r.ID = int(id)
  return nil
}
