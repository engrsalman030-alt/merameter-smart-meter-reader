#!/bin/bash
# Find and kill the process running on port 5000
pid=$(lsof -ti:5000)
if [ ! -z "$pid" ]; then
  kill -9 $pid
fi
# Start the server in the background
cd /Users/salman-pc/Downloads/merameter---smart-meter-reader-pakistan/server
node index.js &
