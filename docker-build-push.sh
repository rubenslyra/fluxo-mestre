#!/bin/bash
set -e

# Image details
IMAGE_NAME="rubenslyra/fluxolab"
VERSION="0.2.0"
GIT_HASH=$(git rev-parse --short HEAD)

# Build tags
TAG_LATEST="${IMAGE_NAME}:latest"
TAG_VERSION="${IMAGE_NAME}:${VERSION}"
TAG_COMMIT="${IMAGE_NAME}:${VERSION}-${GIT_HASH}"

echo "Building Docker image..."
echo "  Latest:  $TAG_LATEST"
echo "  Version: $TAG_VERSION"
echo "  Commit:  $TAG_COMMIT"

docker build \
  --tag "$TAG_LATEST" \
  --tag "$TAG_VERSION" \
  --tag "$TAG_COMMIT" \
  --file Dockerfile \
  .

echo "Images built successfully!"
echo ""
echo "To push to Docker Hub, run:"
echo "  docker push $TAG_LATEST"
echo "  docker push $TAG_VERSION"
echo "  docker push $TAG_COMMIT"
