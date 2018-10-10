#!/bin/bash

basedir=$( cd "$( dirname "${BASH_SOURCE[0]}" )" && pwd )

pid=$(ps aux | grep "$basedir/server$" | awk '{print $2}')
echo "killing process of id $pid"
kill $pid 
