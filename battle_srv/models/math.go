package models

import (
	"fmt"
	"github.com/ByteArena/box2d"
	"math"
)

// Use type `float64` for json unmarshalling of numbers.
type Direction struct {
	Dx float64 `protobuf:"fixed64,1,opt,name=dx,proto3" json:"dx,omitempty"`
	Dy float64 `protobuf:"fixed64,2,opt,name=dy,proto3" json:"dy,omitempty"`
}

type Vec2D struct {
	X float64 `protobuf:"fixed64,1,opt,name=x,proto3" json:"x,omitempty"`
	Y float64 `protobuf:"fixed64,2,opt,name=y,proto3" json:"y,omitempty"`
}

func CreateVec2DFromB2Vec2(b2V2 box2d.B2Vec2) *Vec2D {
	return &Vec2D{
		X: b2V2.X,
		Y: b2V2.Y,
	}
}

func (v2 *Vec2D) ToB2Vec2() box2d.B2Vec2 {
	return box2d.MakeB2Vec2(v2.X, v2.Y)
}

type Polygon2D struct {
	Anchor *Vec2D   `protobuf:"bytes,1,opt,name=anchor,proto3" json:"anchor,omitempty"`
	Points []*Vec2D `json:"-"`
}

func MoveDynamicBody(body *box2d.B2Body, pToTargetPos *box2d.B2Vec2, inSeconds float64) {
	if body.GetType() != box2d.B2BodyType.B2_dynamicBody {
		return
	}
	body.SetTransform(*pToTargetPos, 0.0)
	body.SetLinearVelocity(box2d.MakeB2Vec2(0.0, 0.0))
	body.SetAngularVelocity(0.0)
}

func PrettyPrintFixture(fix *box2d.B2Fixture) {
	fmt.Printf("\t\tfriction:\t%v\n", fix.M_friction)
	fmt.Printf("\t\trestitution:\t%v\n", fix.M_restitution)
	fmt.Printf("\t\tdensity:\t%v\n", fix.M_density)
	fmt.Printf("\t\tisSensor:\t%v\n", fix.M_isSensor)
	fmt.Printf("\t\tfilter.categoryBits:\t%d\n", fix.M_filter.CategoryBits)
	fmt.Printf("\t\tfilter.maskBits:\t%d\n", fix.M_filter.MaskBits)
	fmt.Printf("\t\tfilter.groupIndex:\t%d\n", fix.M_filter.GroupIndex)

	switch fix.M_shape.GetType() {
	case box2d.B2Shape_Type.E_circle:
		{
			s := fix.M_shape.(*box2d.B2CircleShape)
			fmt.Printf("\t\tb2CircleShape shape: {\n")
			fmt.Printf("\t\t\tradius:\t%v\n", s.M_radius)
			fmt.Printf("\t\t\toffset:\t%v\n", s.M_p)
			fmt.Printf("\t\t}\n")
		}
		break

	case box2d.B2Shape_Type.E_polygon:
		{
			s := fix.M_shape.(*box2d.B2PolygonShape)
			fmt.Printf("\t\tb2PolygonShape shape: {\n")
			for i := 0; i < s.M_count; i++ {
				fmt.Printf("\t\t\t%v\n", s.M_vertices[i])
			}
			fmt.Printf("\t\t}\n")
		}
		break

	default:
		break
	}
}

func PrettyPrintBody(body *box2d.B2Body) {
	bodyIndex := body.M_islandIndex

	fmt.Printf("{\n")
	fmt.Printf("\tHeapRAM addr:\t%p\n", body)
	fmt.Printf("\ttype:\t%d\n", body.M_type)
	fmt.Printf("\tposition:\t%v\n", body.GetPosition())
	fmt.Printf("\tangle:\t%v\n", body.M_sweep.A)
	fmt.Printf("\tlinearVelocity:\t%v\n", body.GetLinearVelocity())
	fmt.Printf("\tangularVelocity:\t%v\n", body.GetAngularVelocity())
	fmt.Printf("\tlinearDamping:\t%v\n", body.M_linearDamping)
	fmt.Printf("\tangularDamping:\t%v\n", body.M_angularDamping)
	fmt.Printf("\tallowSleep:\t%d\n", body.M_flags&box2d.B2Body_Flags.E_autoSleepFlag)
	fmt.Printf("\tawake:\t%d\n", body.M_flags&box2d.B2Body_Flags.E_awakeFlag)
	fmt.Printf("\tfixedRotation:\t%d\n", body.M_flags&box2d.B2Body_Flags.E_fixedRotationFlag)
	fmt.Printf("\tbullet:\t%d\n", body.M_flags&box2d.B2Body_Flags.E_bulletFlag)
	fmt.Printf("\tactive:\t%d\n", body.M_flags&box2d.B2Body_Flags.E_activeFlag)
	fmt.Printf("\tgravityScale:\t%v\n", body.M_gravityScale)
	fmt.Printf("\tislandIndex:\t%v\n", bodyIndex)
	fmt.Printf("\tfixtures: {\n")
	for f := body.M_fixtureList; f != nil; f = f.M_next {
		PrettyPrintFixture(f)
	}
	fmt.Printf("\t}\n")
	fmt.Printf("}\n")
}

func Distance(pt1 *Vec2D, pt2 *Vec2D) float64 {
	dx := pt1.X - pt2.X
	dy := pt1.Y - pt2.Y
	return math.Sqrt(dx*dx + dy*dy)
}
