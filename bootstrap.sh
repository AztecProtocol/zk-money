#!/bin/bash
set -e

if [ ! -f ~/.nvm/nvm.sh ]; then
  echo "Nvm not found at ~/.nvm"
  exit 1
fi

\. ~/.nvm/nvm.sh
nvm install

# Until we push .yarn/cache, we still need to install.
cd zk-money
yarn install --immutable
cd ..

echo
echo "Success!"
