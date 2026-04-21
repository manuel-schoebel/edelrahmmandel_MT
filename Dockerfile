# Stage 1: Build Meteor application
FROM node:20 AS builder

# Install Meteor
RUN curl https://install.meteor.com/ | sh
ENV PATH="/root/.meteor:$PATH"

WORKDIR /app

# Copy Meteor config first (layer caching)
COPY .meteor/packages .meteor/packages
COPY .meteor/release .meteor/release
COPY .meteor/versions .meteor/versions

# Install npm dependencies (skip Puppeteer Chromium download - not needed at runtime)
COPY package.json package-lock.json ./
RUN PUPPETEER_SKIP_DOWNLOAD=true npm install --legacy-peer-deps

# Copy application source
COPY . .

# Apply patches
RUN npx patch-package

# Build production bundle
RUN meteor build --directory /bundle --server-only --allow-superuser

# Stage 2: Production image
FROM node:20-slim

# canvas native deps (used by html5-to-pdf)
RUN apt-get update && apt-get install -y --no-install-recommends \
    build-essential \
    python3 \
    libcairo2-dev \
    libpango1.0-dev \
    libjpeg-dev \
    libgif-dev \
    librsvg2-dev \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /bundle/bundle .

RUN cd programs/server && npm install --production

# Data directories (mounted via PVC in k8s)
RUN mkdir -p /app/data/images /app/data/pdfs /app/data/avatars /app/data/pdf-archive

EXPOSE 3000

CMD ["node", "main.js"]
