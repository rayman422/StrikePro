# syntax=docker/dockerfile:1

# Base image with Nginx to serve static files
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

# Default Nginx entrypoint/cmd will serve the content
