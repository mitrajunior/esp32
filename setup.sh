#!/bin/bash
set -e

install_node(){
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash - && \
  apt-get install -y nodejs
}

install_python(){
  apt-get update
  apt-get install -y python3 python3-pip
}

# Node
if ! command -v node >/dev/null; then
  install_node
else
  ver=$(node -v | sed 's/v//');
  major=${ver%%.*}
  if [ "$major" -lt 18 ]; then
    install_node
  fi
fi

# Python
if ! command -v python3 >/dev/null; then
  install_python
else
  pv=$(python3 -V 2>&1 | awk '{print $2}')
  major=${pv%%.*}
  minor=${pv#*.}; minor=${minor%%.*}
  if [ "$major" -lt 3 ] || { [ "$major" -eq 3 ] && [ "$minor" -lt 8 ]; }; then
    install_python
  fi
fi

npm install
npm install --prefix backend || true
npm install --prefix frontend || true

npm start
