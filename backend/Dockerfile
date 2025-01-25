FROM node:22.12.0 AS builder

WORKDIR /app

COPY package*.json ./

RUN npm install --frozen-lockfile

COPY . .

RUN npm run build

########### Multi Stage BUILD ###########
FROM node:22.12.0 AS production

WORKDIR /app

COPY --from=builder /app/dist ./dist
COPY --from=builder /app/package*.json ./

# Instalar as dependências de produção
RUN npm install --only=production --frozen-lockfile

EXPOSE 3000

CMD ["node", "dist/main"]
