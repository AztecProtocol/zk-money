FROM node:18-alpine
RUN apk update && apk add --no-cache git curl bash

WORKDIR usr/src

COPY . .

RUN yarn && yarn build && yarn formatting

WORKDIR ./lambda
RUN apk add zip
RUN yarn && yarn build && yarn && yarn build:zip

FROM node:18-alpine
COPY --from=0 usr/src/dest /usr/src/dest
COPY --from=0 usr/src/lambda /usr/src/lambda

WORKDIR usr/src
CMD []