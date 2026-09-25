# Node.js 22 com suporte nativo a WebSocket (necessario para @supabase/realtime-js)
FROM mcr.microsoft.com/playwright:v1.49.0-noble

WORKDIR /app

# Copia os arquivos de dependencias
COPY package.json ./

# Instala dependencias Node
RUN npm install

# Instala Chromium + Firefox (Firefox tem TLS fingerprint diferente - bypass Cloudflare)
RUN npx playwright install chromium firefox

# Copia o restante do codigo
COPY . .

# Inicia o Worker com display virtual (xvfb) para Firefox nao-headless bypassar Cloudflare
CMD ["xvfb-run", "--server-args=-screen 0 1920x1080x24", "node", "index.js"]
