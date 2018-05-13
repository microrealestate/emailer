FROM node:8-alpine

WORKDIR /usr/app

COPY . .

RUN npm install -g nodemon --silent && \
    npm install --silent

EXPOSE 8083

CMD nodemon --ignore tmp/ --ignore package.json ./index.js