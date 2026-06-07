#!/bin/bash
export NVM_DIR="$HOME/.nvm"
[ -s "$NVM_DIR/nvm.sh" ] && \. "$NVM_DIR/nvm.sh"
nvm use 20 --silent
cd /Users/dipanbaral/Desktop/Projects/metabolic-health-app/apps/web
exec /Users/dipanbaral/.nvm/versions/node/v20.20.2/bin/node \
  /Users/dipanbaral/Desktop/Projects/metabolic-health-app/node_modules/.bin/next \
  dev --turbopack --port 3000
