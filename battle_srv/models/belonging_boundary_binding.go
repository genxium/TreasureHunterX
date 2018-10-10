package models

import (
	sq "github.com/Masterminds/squirrel"
	"github.com/jmoiron/sqlx"
)

type BelongingBoundaryBinding struct {
	BelongingID                 int     `json:"belonging_id" db:"belonging_id"`
	BoundaryType                int     `json:"boundary_type" db:"boundary_type"`
	CounterclockwisePoints      string  `json:"counterclockwise_points" db:"counterclockwise_points"`
	FirstPointOffsetFromAnchorX float32 `json:"first_point_offset_from_anchor_x" db:"first_point_offset_from_anchor_x"`
	FirstPointOffsetFromAnchorY float32 `json:"first_point_offset_from_anchor_y" db:"first_point_offset_from_anchor_y"`
	ID                          int     `json:"id" db:"id"`
}

func GetBelongingBoundaryBindingByBID(bid int) ([]*BelongingBoundaryBinding, error) {
	var ls []*BelongingBoundaryBinding
	err := getList("belonging_boundary_binding", sq.Eq{"belonging_id": bid, "deleted_at": nil}, &ls)
	return ls, err
}

func (b *BelongingBoundaryBinding) Insert(tx *sqlx.Tx) error {
	result, err := txInsert(tx, "belonging_boundary_binding", []string{"belonging_id", "boundary_type", "counterclockwise_points", "first_point_offset_from_anchor_x", "first_point_offset_from_anchor_y"},
		[]interface{}{b.BelongingID, b.BoundaryType, b.CounterclockwisePoints, b.FirstPointOffsetFromAnchorX, b.FirstPointOffsetFromAnchorY})
	if err != nil {
		return err
	}
	id, err := result.LastInsertId()
	if err != nil {
		return err
	}
	b.ID = int(id)
	return nil
}
