FROM node:18-alpine

WORKDIR /app

COPY package*.json ./

RUN npm install --omit=dev

COPY . .
COPY .env .env

EXPOSE 3001

CMD npx prisma generate && npx prisma migrate deploy && npm start
