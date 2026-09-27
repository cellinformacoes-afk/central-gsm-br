# Node.js 22 com suporte nativo a WebSocket (necessario para @supabase/realtime-js)
FROM mcr.microsoft.com/playwright:v1.49.0-noble

WORKDIR /app

# Copia os arquivos de dependencias
COPY package.json ./

# Instala dependencias Node
RUN npm install

# Instala Chromium (com stealth plugin para bypass Cloudflare)
RUN npx playwright install chromium --with-deps

# Copia o restante do codigo
COPY . .

# Inicia o Worker
CMD ["node", "index.js"]
