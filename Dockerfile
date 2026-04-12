FROM node:20-bookworm-slim

WORKDIR /app

COPY package*.json ./
COPY .npmrc ./

RUN npm install --no-audit --prefer-offline

COPY . .

ENV NODE_ENV=production

CMD ["npm", "run", "start"]