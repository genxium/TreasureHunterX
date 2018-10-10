PROJECTNAME=server
ROOT_DIR=$(shell pwd)
all: help

## gen-constants: constants.json生成common/constants.go
gen-constants:
	gojson -pkg common -name constants -input common/constants.json  -o common/constants_struct.go
	sed -i 's/int64/int/g' common/constants_struct.go

## ServerEnv == TEST部分 begins
run-test: build
	ServerEnv=TEST ./server

run-test-and-hotreload:
	ServerEnv=TEST CompileDaemon -log-prefix=false -build="go build"  -command="./server"

build:
	go build
## ServerEnv == TEST部分 ends

## ServerEnv == PROD部分 begins
run-prod: build-prod
	./server

## build-prod: 可执行文件会被压缩，并新增版本号
build-prod:
	go build  -ldflags "-s -w -X main.VERSION=$(shell git rev-parse --short HEAD)-$(shell date "+%Y%m%d-%H:%M:%S")" -o $(ROOT_DIR)/build/server
## ServerEnv == PROD部分 ends

.PHONY: help

help: Makefile
	@echo
	@echo " Choose a command run:"
	@echo
	@sed -n 's/^##//p' $< | column -t -s ':' |  sed -e 's/^/ /'
	@echo
 
