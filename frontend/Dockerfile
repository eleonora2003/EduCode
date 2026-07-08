FROM node:20

WORKDIR /app

RUN addgroup --system nonroot \
    && adduser --system nonroot --group nonroot

COPY package.json .
RUN npm install

COPY public/ ./public/
COPY src/ ./src/
COPY package-lock.json .
COPY babel.config.js .
COPY jest.config.js .

RUN chown -R nonroot:nonroot /app

USER nonroot

EXPOSE 3000

CMD ["npm", "start"]