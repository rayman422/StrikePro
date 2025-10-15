# syntax=docker/dockerfile:1

# Base image with Nginx to serve static files
FROM node:20-alpine AS api

WORKDIR /app
COPY api/package.json ./api/package.json
RUN --mount=type=cache,target=/root/.npm npm --prefix ./api install --omit=dev
COPY api ./api

FROM nginx:1.27-alpine

# Metadata labels
LABEL org.opencontainers.image.title="Strike Pro Boxing Site" \
      org.opencontainers.image.description="Static boxing training landing page served by Nginx" \
      org.opencontainers.image.licenses="MIT"

# Utilities for healthcheck
RUN apk add --no-cache curl

# Copy custom Nginx config
COPY nginx/default.conf /etc/nginx/conf.d/default.conf

# Copy static site assets
COPY index.html /usr/share/nginx/html/index.html
COPY 404.html /usr/share/nginx/html/404.html
COPY robots.txt /usr/share/nginx/html/robots.txt
COPY favicon.svg /usr/share/nginx/html/favicon.svg
COPY sitemap.xml /usr/share/nginx/html/sitemap.xml

# Expose HTTP
EXPOSE 80

# Container healthcheck
HEALTHCHECK --interval=30s --timeout=3s --start-period=5s --retries=3 \
  CMD curl -fsS http://localhost/healthz || exit 1

# Run Node API sidecar inside same container (simple approach)
COPY --from=api /app/api /opt/strike-pro-api
RUN apk add --no-cache dumb-init
CMD ["/bin/sh", "-c", "node /opt/strike-pro-api/server.js & nginx -g 'daemon off;' "]

# Default Nginx entrypoint/cmd will serve the content
