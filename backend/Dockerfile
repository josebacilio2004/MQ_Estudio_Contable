FROM node:20-alpine

# Instalar Chromium y dependencias necesarias para Puppeteer en Alpine
RUN apk add --no-cache \
      chromium \
      nss \
      freetype \
      harfbuzz \
      ca-certificates \
      ttf-freefont

ENV PUPPETEER_SKIP_CHROMIUM_DOWNLOAD=true \
    PUPPETEER_EXECUTABLE_PATH=/usr/bin/chromium-browser

WORKDIR /app

COPY package*.json ./
RUN npm install --production

COPY . .

EXPOSE 4100

CMD ["node", "src/server.js"]
