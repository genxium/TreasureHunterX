#!/bin/bash

if [ $# -ne 1 ]; then 
  echo "Usage: $0 [TEST|PROD]"
  exit 1
fi

OS_USER=$USER
ServerEnv=$1
LOG_PATH="/var/log/cuisine-master.log"

basedir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

sudo su - root -c "touch $LOG_PATH" 
sudo su - root -c "chown $OS_USER:$OS_USER $LOG_PATH" 

ServerEnv=$ServerEnv $basedir/server >$LOG_PATH 2>&1 &
