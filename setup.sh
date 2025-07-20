#!/bin/bash
set -e

echo "🚀 ESP32 Controller App Setup"

if ! command -v node >/dev/null; then
  echo "📦 Node.js não encontrado. Instalando..."
  curl -fsSL https://deb.nodesource.com/setup_18.x | bash -
  apt-get install -y nodejs
fi

if ! command -v avahi-browse >/dev/null; then
  echo "📡 Instalando Avahi para mDNS..."
  apt-get install -y avahi-utils
fi

echo "📦 Instalando dependências NPM..."
npm install

echo "⚡ Build do frontend..."
npm run build

echo "🚀 Iniciando servidor..."
npm start
