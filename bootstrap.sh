#!/bin/bash
set -e

if [ ! -f ~/.nvm/nvm.sh ]; then
  echo "Nvm not found at ~/.nvm"
  exit 1
fi

git submodule update --init --recursive

\. ~/.nvm/nvm.sh
nvm install

# Until we push .yarn/cache, we still need to install.
yarn install --immutable

yarn build

echo
echo "Success! You may now run `yarn start:dev` to start the app."
