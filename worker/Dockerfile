# Imagem base com Node.js 20 e dependências do Playwright já incluídas
FROM mcr.microsoft.com/playwright:v1.42.0-jammy

WORKDIR /app

# Copia os arquivos de dependências
COPY package.json ./

# Instala dependências Node
RUN npm install

# Instala o browser Chromium do Playwright
RUN npx playwright install chromium

# Copia o restante do código
COPY . .

# Inicia o Worker
CMD ["node", "index.js"]
