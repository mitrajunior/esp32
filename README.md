# ESP32 Controller App

Aplicação fullstack para gerir dispositivos ESPHome na rede local.

## Estrutura
- `client/` Frontend React com Vite e Tailwind
- `server/` Backend Express
- `dist/` (gerado após `npm run build`)
- `setup.sh` Script de instalação

## Comandos
- `npm install` instala dependências
- `npm run dev` ambiente de desenvolvimento (frontend + backend)
- `npm run build` compila o frontend para `dist/`
- `npm start` arranca o servidor para produção

Para instalar dependências e iniciar o servidor de produção automaticamente,
basta executar:

```bash
bash setup.sh
```

O servidor expõe API REST e WebSocket para monitorizar dispositivos.
