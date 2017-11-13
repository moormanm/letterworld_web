#!/bin/bash


dest="letterworld@104.236.18.86:~/letterworld_web/"

rsync -avh dist/ $dest/dist/ --delete
scp server.dist.js $dest
scp package.json $dest

