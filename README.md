# StrikePro

Static landing site for professional boxing training, served by Nginx.

## Features
- Modern responsive landing page
- SEO metadata (OG/Twitter, canonical, robots)
- Accessibility improvements (skip link, landmarks, focus styles)
- Sitemap and robots.txt
- Hardened Nginx config with security headers, gzip, caching

## Quick start (local)
You can serve the static files with any HTTP server:

```bash
# Python 3
python3 -m http.server 8080 --directory .
# or npm http-server if installed
# npx http-server -p 8080 .
```

Visit http://localhost:8080

Note: Some headers (CSP, gzip) are only applied by Nginx in Docker.

## Docker
Build and run the Nginx image that serves this site.

```bash
# Build
docker build -t strikepro:latest .

# Run
docker run --rm -p 8080:80 strikepro:latest

# Health check
curl -fsS http://localhost:8080/healthz
```

## File structure
- `index.html`: main landing page
- `404.html`: not found page
- `robots.txt`: robots policy, sitemap reference
- `sitemap.xml`: sitemap entries
- `favicon.svg`: site icon
- `nginx/default.conf`: Nginx server configuration used in the image
- `Dockerfile`: container definition

## Deployment notes
- Set your canonical domain by updating:
  - `index.html` `<link rel="canonical" ...>` and OG/Twitter URLs
  - `sitemap.xml` and `robots.txt` sitemap URL
- If serving over HTTPS behind a reverse proxy, keep HSTS enabled. For initial testing on HTTP only, HSTS is harmless but only applied over HTTPS.
- Content-Security-Policy allows inline script for JSON-LD only. Avoid adding other inline scripts.

## License
MIT
