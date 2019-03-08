package models

import (
	"github.com/ByteArena/box2d"
	"fmt"
  . "github.com/logrusorgru/aurora"
)

type Trap struct {
	Id               int32         `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	LocalIdInBattle  int32         `protobuf:"varint,2,opt,name=localIdInBattle,proto3" json:"localIdInBattle,omitempty"`
	Type             int32         `protobuf:"varint,3,opt,name=type,proto3" json:"type,omitempty"`
	X                float64       `protobuf:"fixed64,4,opt,name=x,proto3" json:"x,omitempty"`
	Y                float64       `protobuf:"fixed64,5,opt,name=y,proto3" json:"y,omitempty"`
	Removed          bool          `protobuf:"varint,6,opt,name=removed,proto3" json:"removed,omitempty"`
	PickupBoundary   *Polygon2D    `json:"-"`
	TrapBullets      []*Bullet     `json:"-"`
	CollidableBody   *box2d.B2Body `json:"-"`
	RemovedAtFrameId int32         `json:"-"`
}

type GuardTower struct {
	Id               int32         `protobuf:"varint,1,opt,name=id,proto3" json:"id,omitempty"`
	LocalIdInBattle  int32         `protobuf:"varint,2,opt,name=localIdInBattle,proto3" json:"localIdInBattle,omitempty"`
	Type             int32         `protobuf:"varint,3,opt,name=type,proto3" json:"type,omitempty"`
	X                float64       `protobuf:"fixed64,4,opt,name=x,proto3" json:"x,omitempty"`
	Y                float64       `protobuf:"fixed64,5,opt,name=y,proto3" json:"y,omitempty"`
	Removed          bool          `protobuf:"varint,6,opt,name=removed,proto3" json:"removed,omitempty"`
	PickupBoundary   *Polygon2D    `json:"-"`
	TrapBullets      []*Bullet     `json:"-"`
	CollidableBody   *box2d.B2Body `json:"-"`
	RemovedAtFrameId int32         `json:"-"`

  //kobako
  InRangePlayerMap map[int32]*InRangePlayerNode `json:"-"`
  //CurrentAttackingIndex int32 `json:"-"`
  CurrentAttackingNodePointer *InRangePlayerNode `json:"-"` //准备攻击的玩家Node
  LastAttackTick  int64 `json:"-"`
}


/// Doubly circular linked list Implement

type InRangePlayerNode struct {
  Prev *InRangePlayerNode
  Next *InRangePlayerNode
  player *Player
}

func (node *InRangePlayerNode) AppendNode(newNode *InRangePlayerNode) *InRangePlayerNode{
  if node == nil {
    return newNode
  }else if node.Next == nil && node.Prev == nil {
    node.Prev = newNode
    node.Next = newNode
    newNode.Prev = node
    newNode.Next = node
    return node
  }else{
    oldNext := node.Next
    node.Next = newNode
    newNode.Next = oldNext
    oldNext.Prev = newNode
    newNode.Prev = node
    return node
  }
}


func (node *InRangePlayerNode) PrependNode(newNode *InRangePlayerNode) *InRangePlayerNode{
  if node == nil { //没有节点的情况
    return newNode
  }else if node.Next == nil && node.Prev == nil { //单个节点的情况
    node.Prev = newNode
    node.Next = newNode
    newNode.Prev = node
    newNode.Next = node
    return node
  }else{
    oldPrev := node.Prev
    node.Prev = newNode
    newNode.Prev = oldPrev
    oldPrev.Next = newNode
    newNode.Next = node
    return node
  }
}

func (node *InRangePlayerNode) RemoveFromLink(){
  if node == nil{
    return
  }else if(node.Next == nil && node.Prev == nil){
    node = nil //Wait for GC
  }else{
    prev := node.Prev
    next := node.Next
    prev.Next = next
    next.Prev = prev
    node = nil
  }
}

func (node *InRangePlayerNode) Print(){
  if(node == nil){
    fmt.Println("No player in range")
  }else if (node.Next == nil && node.Prev == nil){
    fmt.Println(Red(node.player.Id))
  }else{
    now := node.Next
    fmt.Printf("%d ", Red(node.player.Id))
    for node != now {
      fmt.Printf("%d ", Green(now.player.Id))
      now = now.Next
    }
    fmt.Println("")
  }
}

/// End Doubly circular linked list Implement
