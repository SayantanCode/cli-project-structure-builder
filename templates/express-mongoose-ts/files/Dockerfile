FROM node:18-alpine

WORKDIR /app
COPY package.json .
COPY pnpm-lock.yaml .
RUN pnpm install --prod
COPY . .

EXPOSE 4000
CMD ["npm", "start"]
