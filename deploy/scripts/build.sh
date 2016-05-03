#!/usr/bin/env bash
set -euo pipefail

PROJECT=tinifyd
SCRIPT_PATH=$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)/$(basename "${BASH_SOURCE[0]}")
SCRIPT_DIR=$(dirname $SCRIPT_PATH)
PROJECT_ROOT=$(readlink -f "$SCRIPT_DIR/../..")

PACKAGE_VERSION=$(cat "$PROJECT_ROOT/VERSION" | xargs)

GIT_REVISION=$(git rev-parse HEAD | xargs)
GIT_REVISION_ABBREV=$(echo $GIT_REVISION | cut -c-8)

DOCKER_REGISTRY_HOST=docker.it-consultis.com.cn
DOCKER_REGISTRY_NS=itc
DOCKER_REGISTRY_REPO=tinifyd
DOCKER_REGISTRY_REPO_TAG="${PACKAGE_VERSION}-${GIT_REVISION_ABBREV}"
DOCKER_IMAGE="${DOCKER_REGISTRY_HOST}/${DOCKER_REGISTRY_NS}/${DOCKER_REGISTRY_REPO}:${DOCKER_REGISTRY_REPO_TAG}"

cd $PROJECT_ROOT

npm install

docker build -t $DOCKER_IMAGE .
docker push $DOCKER_IMAGE
docker images | grep "$DOCKER_IMAGE"

exit 0
