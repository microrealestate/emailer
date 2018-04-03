FROM node:8-alpine AS base
WORKDIR /usr/app
COPY . .

FROM base as dependencies
RUN npm set progress=false && \
    npm config set depth 0 && \
    npm install --only=production

FROM base AS release
COPY --from=dependencies /usr/app .
EXPOSE 8083
CMD npm run start
