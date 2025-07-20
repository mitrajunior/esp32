#!/bin/bash
set -e

if ! command -v node >/dev/null 2>&1; then
  echo "Node.js not found, installing..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
fi

pushd backend
npm install
popd

pushd frontend
npm install
npm run build
popd

read -p "Port for server [8080]: " PORT
PORT=${PORT:-8080}

cd backend
PORT=$PORT npm start
