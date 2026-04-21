#!/usr/bin/env bash
# Usage: ./scripts/docker-push.sh [tag]
# Builds and pushes the Docker image to GitHub Container Registry.
#
# Requirements:
#   - Docker running
#   - GITHUB_TOKEN env var set (needs write:packages scope)
#     OR: gh auth token is available (gh CLI logged in)
#
# Examples:
#   ./scripts/docker-push.sh           # pushes :latest
#   ./scripts/docker-push.sh 1.2.3     # pushes :1.2.3 and :latest
#   ./scripts/docker-push.sh staging   # pushes :staging

set -euo pipefail

GHCR_USER="manuel-schoebel"
IMAGE_NAME="edelrahmmandel_mt"
REGISTRY="ghcr.io"
FULL_IMAGE="${REGISTRY}/${GHCR_USER}/${IMAGE_NAME}"

TAG="${1:-latest}"

# Login to GHCR
echo "Logging in to ${REGISTRY}..."
if [ -n "${GITHUB_TOKEN:-}" ]; then
  echo "${GITHUB_TOKEN}" | docker login "${REGISTRY}" -u "${GHCR_USER}" --password-stdin
else
  # Fall back to gh CLI token
  gh auth token | docker login "${REGISTRY}" -u "${GHCR_USER}" --password-stdin
fi

# Build
echo "Building ${FULL_IMAGE}:${TAG}..."
docker buildx build \
  --no-cache \
  --platform linux/amd64 \
  --load \
  --progress=plain \
  -t "${FULL_IMAGE}:${TAG}" \
  -f Dockerfile \
  .

# Also tag as latest if a specific tag was given
if [ "${TAG}" != "latest" ]; then
  docker tag "${FULL_IMAGE}:${TAG}" "${FULL_IMAGE}:latest"
fi

# Push
echo "Pushing ${FULL_IMAGE}:${TAG}..."
docker push "${FULL_IMAGE}:${TAG}"

if [ "${TAG}" != "latest" ]; then
  echo "Pushing ${FULL_IMAGE}:latest..."
  docker push "${FULL_IMAGE}:latest"
fi

echo "Done: ${FULL_IMAGE}:${TAG}"
