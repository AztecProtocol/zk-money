FROM node:18-alpine
RUN apk update && apk add --no-cache git curl bash

COPY . zk-money
COPY lambda lambda

WORKDIR zk-money
RUN yarn && yarn build && yarn formatting

WORKDIR ../lambda
RUN apk add zip
RUN yarn && yarn build && yarn && yarn build:zip

FROM node:18-alpine
COPY --from=0 zk-money /usr/src/zk-money
COPY --from=0 lambda /usr/src/lambda

WORKDIR usr/src/zk-money
CMD ["yarn", "start"]
EXPOSE 8080