FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
COPY .npmrc ./

RUN npm ci --omit=dev --no-audit

COPY . .

ENV NODE_ENV=production

CMD ["npm", "run", "start"]