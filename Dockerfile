FROM node:20-slim@sha256:2cf067cfed83d5ea958367df9f966191a942351a2df77d6f0193e162b5febfc0

# Prisma engine precisa de openssl no runtime
RUN apt-get update -y && apt-get install -y --no-install-recommends openssl && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY package*.json ./
COPY prisma ./prisma

RUN npm install

COPY . .

RUN npx prisma generate
RUN npm run build

EXPOSE 3000

# Aplica migrations pendentes e sobe a API. Idempotente - seguro rodar toda vez que o container sobe.
CMD ["sh", "-c", "npx prisma migrate deploy && node dist/main.js"]
