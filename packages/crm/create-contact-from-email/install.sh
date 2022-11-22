#!/bin/bash

# Install everything then build the JS
echo "Installing deps ....."
yarn install 

echo "Building ....."
yarn build

# Remove all modules then only install required deps
echo "Removing old deps ..."
rm -rf node_modules

echo "Only install prod deps ......"
yarn install --production