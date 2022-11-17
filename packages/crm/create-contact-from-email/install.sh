#!/bin/bash

# Install everything then build the JS
yarn install 
yarn build

# Remove all modules then only install required deps
rm -rf node_modules
yarn install --production