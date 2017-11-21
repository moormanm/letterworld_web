#!/bin/bash


dest="letterworld@104.236.18.86:~/letterworld_web/"

rsync -avh dist/ $dest/dist/ --delete
rsync -avh soundStore/ $dest/soundStore/ --delete
rsync -avh builtins/ $dest/builtins/ --delete
rsync -avh templates/ $dest/templates/ --delete
scp server.dist.js $dest
scp package.json $dest

