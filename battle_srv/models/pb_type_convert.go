package models

import (
	pb "server/pb_output"
)

func toPbPlayers(modelInstances map[int32]*Player) map[int32]*pb.Player {
	toRet := make(map[int32]*pb.Player, 0)
  if nil == modelInstances {
    return toRet
  }

	for k, last := range modelInstances {
		toRet[k] = &pb.Player{
			Id: last.Id,
			X:  last.X,
			Y:  last.Y,
			Dir: &pb.Direction{
				Dx: last.Dir.Dx,
				Dy: last.Dir.Dy,
			},
			Speed:       last.Speed,
			BattleState: last.BattleState,
			Score:       last.Score,
			Removed:     last.Removed,
			JoinIndex:   last.JoinIndex,
		}
	}

	return toRet
}

func toPbTreasures(modelInstances map[int32]*Treasure) map[int32]*pb.Treasure {
	toRet := make(map[int32]*pb.Treasure, 0)
  if nil == modelInstances {
    return toRet
  }

	for k, last := range modelInstances {
		toRet[k] = &pb.Treasure{
			Id:              last.Id,
			LocalIdInBattle: last.LocalIdInBattle,
			Score:           last.Score,
			X:               last.X,
			Y:               last.Y,
			Removed:         last.Removed,
			Type:            last.Type,
		}
	}

	return toRet
}

func toPbTraps(modelInstances map[int32]*Trap) map[int32]*pb.Trap {
	toRet := make(map[int32]*pb.Trap, 0)
  if nil == modelInstances {
    return toRet
  }

	for k, last := range modelInstances {
		toRet[k] = &pb.Trap{
			Id:              last.Id,
			LocalIdInBattle: last.LocalIdInBattle,
			X:               last.X,
			Y:               last.Y,
			Removed:         last.Removed,
			Type:            last.Type,
		}
	}

	return toRet
}

func toPbBullets(modelInstances map[int32]*Bullet) map[int32]*pb.Bullet {
	toRet := make(map[int32]*pb.Bullet, 0)
  if nil == modelInstances {
    return toRet
  }

	for k, last := range modelInstances {
    if nil == last.StartAtPoint || nil == last.EndAtPoint {
      continue
    }
		toRet[k] = &pb.Bullet{
			LocalIdInBattle: last.LocalIdInBattle,
			X:               last.X,
			Y:               last.Y,
			Removed:         last.Removed,
      StartAtPoint:    &pb.Vec2D{
        X: last.StartAtPoint.X,
        Y: last.StartAtPoint.Y,
      },
      EndAtPoint:      &pb.Vec2D{
        X: last.EndAtPoint.X,
        Y: last.EndAtPoint.Y,
      },
		}
	}

	return toRet
}


func toPbSpeedShoes(modelInstances map[int32]*SpeedShoe) map[int32]*pb.SpeedShoe {
	toRet := make(map[int32]*pb.SpeedShoe, 0)
  if nil == modelInstances {
    return toRet
  }

	for k, last := range modelInstances {
		toRet[k] = &pb.SpeedShoe{
			Id:              last.Id,
			LocalIdInBattle: last.LocalIdInBattle,
			X:               last.X,
			Y:               last.Y,
			Removed:         last.Removed,
      Type:            last.Type,
		}
	}

	return toRet
}

func toPbGuardTowers(modelInstances map[int32]*GuardTower) map[int32]*pb.GuardTower {
	toRet := make(map[int32]*pb.GuardTower, 0)
  if nil == modelInstances {
    return toRet
  }

	for k, last := range modelInstances {
		toRet[k] = &pb.GuardTower{
			Id:              last.Id,
			LocalIdInBattle: last.LocalIdInBattle,
			X:               last.X,
			Y:               last.Y,
			Removed:         last.Removed,
      Type:            last.Type,
		}
	}

	return toRet
}
