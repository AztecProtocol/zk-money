FROM node:18-alpine
RUN apk update && apk add --no-cache build-base git python3 curl bash jq
WORKDIR /usr/src/yarn-project

# We only want to copy the package.json's, to ensure we only rebuild this image if project dependencies changed.
COPY zk-money/package.json zk-money/package.json
COPY zk-money/lambda/package.json zk-money/lambda/package.json

# All workspaces use the linting config, so always include it.
COPY eslint-config eslint-config
COPY .pnp.cjs .pnp.loader.mjs .yarnrc.yml package.json babel.config.json yarn.lock .prettierrc.js ./
COPY .yarn .yarn
# Although we're attempting to be "zero-install", in practice we still need to build arch specific packages.
RUN yarn --immutable

# If everything's worked properly, we should no longer need access to the network.
# RUN echo "enableNetwork: false" >> .yarnrc.yml

# Yarn devs won't provide an extremely simple and useful feature of pruning dev dependencies from the local cache:
# https://github.com/yarnpkg/berry/issues/1789
#
# To work around this, we construct a global cache from the local cache using hard links (requires a hacky rename).
# When we build an upstream docker image, we:
# - Do the build.
# - Erase the local cache with a `yarn cache clean`. Files remain in global cache due to hard link.
# - Do a `yarn workspaces focus --production` to install production dependencies from the global cache, to .yarn/cache
# - A final stage of the build strips away the global cache.
RUN /bin/bash -c '\
[ -d /root/.yarn/berry/cache ] && exit 0; \
cd .yarn/cache && \
mkdir -p /root/.yarn/berry/cache && \
for F in *; do \
  [[ $F =~ (.*-) ]] && ln $F /root/.yarn/berry/cache/${BASH_REMATCH[1]}8.zip; \
done'