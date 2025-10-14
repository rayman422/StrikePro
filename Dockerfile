# syntax=docker/dockerfile:1

# Base image with Nginx to serve static files
FROM nginx:1.27-alpine

# Metadata labels
LABEL org.opencontainers.image.title="Strike Pro Boxing Site" \
      org.opencontainers.image.description="Static boxing training landing page served by Nginx" \
      org.opencontainers.image.licenses="MIT"

# Copy static site
COPY index.html /usr/share/nginx/html/index.html

# Expose HTTP
EXPOSE 80

# Default Nginx entrypoint/cmd will serve the content
