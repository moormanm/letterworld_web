#!/bin/bash
bash build.sh || exit
bash deploy.sh

ssh -T letterworld@letterworldgame.com <<ENDHEREDOC

cd letterworld_web
bash run_bg.sh

ENDHEREDOC

