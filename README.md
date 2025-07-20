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
- `npm run dev` inicia o Vite em modo desenvolvimento (interface em http://localhost:5173 ou na porta indicada pelo Vite)

O servidor expõe API REST e WebSocket para monitorizar dispositivos.
