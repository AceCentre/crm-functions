#! /bin/bash

cd shared
yarn install
yarn local-build

cd ../packages/crm/create-contact-from-email
yarn install
yarn local-build

cd ../../../