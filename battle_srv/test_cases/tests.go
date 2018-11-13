package main

import (
	. "server/common"
	"path/filepath"
	"server/models"
	"io/ioutil"
  "os"
	"fmt"
)

var relativePath string

func loadTMX(fp string, pTmxMapIns *models.TmxMap) {
	if !filepath.IsAbs(fp) {
    panic("Tmx filepath must be absolute!")
	}

  byteArr, err := ioutil.ReadFile(fp)
  ErrFatal(err)
  models.DeserializeToTmxMapIns(byteArr, pTmxMapIns)
  for _, playerPos := range pTmxMapIns.TreasuresInitPosList {
    fmt.Printf("%v\n", playerPos)
  }
}

func main() {
  relativePath = "../../frontend/assets/resources/treasurehunter_1107_v2/treasurehunter.tmx"
	execPath, err := os.Executable()
	ErrFatal(err)

	pwd, err := os.Getwd()
	ErrFatal(err)

  fmt.Printf("execPath = %v, pwd = %s, returning...\n", execPath, pwd)

  tmxMapIns := models.TmxMap{}
  pTmxMapIns := &tmxMapIns
  fp := filepath.Join(pwd, relativePath)
  fmt.Printf("fp == %v\n", fp)
  loadTMX(fp, pTmxMapIns)
}
