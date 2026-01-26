#!/usr/bin/env bash
set -euxo pipefail

if [ -n "${BUILD_NOSUDO:-}" ]; then
    DOCKER_CMD="docker"
else
    DOCKER_CMD="sudo docker"
fi

rm -rf review
mkdir review
$DOCKER_CMD build . --tag taostats-builder
$DOCKER_CMD run --rm --volume "$(pwd)/review":/review taostats-builder bash -c ' \
    NODE_OPTIONS=--max_old_space_size=8192 USE_ONE_DIST_DIR=true pnpm build:extension:prod:firefox && \
    cp /taostats/apps/extension/dist/*.zip /review/ && \
    rm -rf /taostats/apps/extension/dist && \
    find /taostats/ -depth -type d -name node_modules -exec rm -rf {} \; && \
    cp -r /taostats/ /review/sources && \
    rm -f /review/sources/apps/extension/.env.local
'
cd review
zip -qr source.zip ./sources/
