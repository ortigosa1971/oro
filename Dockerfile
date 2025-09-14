# Base con glibc (prebuilds de better-sqlite3)
FROM node:20-bullseye-slim

WORKDIR /app
RUN mkdir -p /app /data

# Instalar deps primero (cache)
COPY package.json ./
RUN npm install --production

# Copiar resto de archivos
COPY . .

ENV NODE_ENV=production
ENV PORT=8080
ENV DB_PATH=/data/usuarios.db

EXPOSE 8080

COPY docker-entrypoint.sh /usr/local/bin/docker-entrypoint.sh
RUN chmod +x /usr/local/bin/docker-entrypoint.sh

CMD ["/usr/local/bin/docker-entrypoint.sh"]
