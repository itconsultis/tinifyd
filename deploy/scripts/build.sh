#!/usr/bin/env bash
set -xeuo pipefail

PROJECT=tinifyd
SCRIPT_PATH=$(cd $(dirname "${BASH_SOURCE[0]}") && pwd)/$(basename "${BASH_SOURCE[0]}")
SCRIPT_DIR=$(dirname $SCRIPT_PATH)
PROJECT_ROOT=$(readlink -f "$SCRIPT_DIR/../..")

PACKAGE_VERSION=$(cat $PROJECT_ROOT/VERSION | xargs)

GIT_REVISION=$(git rev-parse HEAD | xargs)
GIT_REVISION_ABBREV=$(echo $GIT_REVISION | cut -c-8)
GIT_REMOTE=origin
GIT_REPOSITORY=$(git config --get "remote.${GIT_REMOTE}.url")

DOCKER_REGISTRY_HOST=docker.it-consultis.com.cn
DOCKER_REGISTRY_NS=itc
DOCKER_REGISTRY_REPO=tinifyd
DOCKER_REGISTRY_REPO_TAG="${PACKAGE_VERSION}-${GIT_REVISION_ABBREV}"
DOCKER_IMAGE="${DOCKER_REGISTRY_HOST}/${DOCKER_REGISTRY_NS}/${DOCKER_REGISTRY_REPO}:${DOCKER_REGISTRY_REPO_TAG}"

TMP_DIR="/tmp/${PROJECT}/builds/${GIT_REVISION}"

rm -rf $TMP_DIR
mkdir -p $TMP_DIR
cd $TMP_DIR

git init
git remote add $GIT_REMOTE $GIT_REPOSITORY
git fetch --all
git reset --hard FETCH_HEAD

docker build -t "${DOCKER_IMAGE}" .

