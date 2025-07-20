# ESP32 Controller App

Aplicação fullstack para gerir dispositivos ESPHome na rede local.

## Estrutura
- `client/` Frontend React com Vite e Tailwind
- `server/` Backend Express
- `shared/` Código partilhado
- `dist/` Build de produção
- `setup.sh` Script de instalação

## Comandos
- `npm install` instala dependências
- `npm run build` compila o frontend para `dist/`
- `npm start` arranca o servidor

O servidor expõe API REST e WebSocket para monitorizar dispositivos.
