FROM node:20

WORKDIR /app

COPY package.json .
RUN npm install

COPY public/ ./public/
COPY src/ ./src/
COPY package-lock.json .
COPY babel.config.js .
COPY jest.config.js .


EXPOSE 3000

CMD ["npm", "start"]