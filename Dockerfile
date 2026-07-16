# Imagem baseada em Debian (não Alpine) para evitar problemas de compatibilidade
# entre os binarios do Prisma e a libc musl do Alpine.
FROM node:22-bookworm-slim

WORKDIR /app

RUN apt-get update \
  && apt-get install -y --no-install-recommends openssl ca-certificates \
  && rm -rf /var/lib/apt/lists/*

COPY . .
RUN npm ci
RUN npm run build

ENV NODE_ENV=production
EXPOSE 3000

CMD ["npm", "run", "start"]
