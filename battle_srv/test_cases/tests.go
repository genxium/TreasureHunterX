package main

import (
	. "server/common"
	"path/filepath"
	"server/models"
	"io/ioutil"
  "os"
	"fmt"
)

func loadTMX(fp string, v interface{}) {
	if !filepath.IsAbs(fp) {
    panic("Tmx filepath must be absolute!")
	}

  byteArr, err := ioutil.ReadFile(fp)
  ErrFatal(err)
  // fmt.Printf("byteArr == %v\n", byteArr)
  pTmxMapIns := v.(*models.TmxMap)
  models.LoadTMX(byteArr, pTmxMapIns)

  xmlStr , _ := pTmxMapIns.ToXML()
  fmt.Printf("%v", xmlStr)
}

func main() {
	execPath, err := os.Executable()
	ErrFatal(err)

	pwd, err := os.Getwd()
	ErrFatal(err)

  fmt.Printf("execPath = %v, pwd = %s, returning...\n", execPath, pwd)

  tmxMapIns := models.TmxMap{}
  pTmxMapIns := &tmxMapIns
  fp := filepath.Join(pwd, "treasurehunter.tmx")
  fmt.Printf("fp == %v\n", fp)
  loadTMX(fp, pTmxMapIns)
}
