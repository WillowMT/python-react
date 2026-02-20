

# Nginx Integration

This document explains how nginx is integrated into the frontend to serve the React SPA and proxy API requests to the FastAPI backend.

## Overview

The frontend uses a multi-stage Docker build:

1. **Build stage**: Bun compiles the React app with Vite → static files in `dist/`
2. **Runtime stage**: nginx serves those static files and proxies `/api` to the backend

```
┌─────────────┐     ┌──────────────────────────────────────┐     ┌──────────┐
│   Browser   │────▶│  nginx (frontend container :80)        │────▶│ Backend  │
│             │     │  • /       → static files (SPA)         │     │ :8000    │
│             │     │  • /api/*  → proxy to backend           │     │          │
└─────────────┘     └──────────────────────────────────────┘     └──────────┘
```

## Files Involved

| File | Purpose |
|------|---------|
| `frontend/nginx.conf` | nginx server block (static + proxy rules) |
| `frontend/Dockerfile` | Multi-stage build: Bun → nginx |

## nginx Configuration

### Static file serving

```nginx
root /usr/share/nginx/html;
index index.html;

location / {
    try_files $uri $uri/ /index.html;
}
```

- **root**: Vite build output is copied to `/usr/share/nginx/html` in the container
- **try_files**: For client-side routing (React Router), any non-file path falls back to `index.html` so the SPA handles the route

### API proxy

```nginx
location /api {
    rewrite ^/api/?(.*) /$1 break;
    proxy_pass http://backend:8000;
    proxy_http_version 1.1;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
    proxy_set_header X-Forwarded-Proto $scheme;
}
```

| Directive | Purpose |
|-----------|---------|
| `rewrite ^/api/?(.*) /$1 break` | Strips `/api` prefix. `/api/health` → `/health`, `/api` → `/` |
| `proxy_pass http://backend:8000` | Forwards to the backend service on the Docker network |
| `proxy_set_header Host` | Preserves the original Host header |
| `proxy_set_header X-Real-IP` | Passes client IP for logging/rate-limiting |
| `proxy_set_header X-Forwarded-For` | Chain of proxies for debugging |
| `proxy_set_header X-Forwarded-Proto` | Original scheme (http/https) for redirects |

### Gzip

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript text/xml application/xml;
```

Compresses responses to reduce transfer size.

## Docker Integration

### Dockerfile

```dockerfile
FROM nginx:alpine AS runtime

COPY --from=builder /app/dist /usr/share/nginx/html
COPY nginx.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]
```

- Static files from the build stage go to `/usr/share/nginx/html`
- `nginx.conf` replaces the default server config in `/etc/nginx/conf.d/`
- `daemon off` keeps nginx in the foreground for Docker

### Service discovery

The backend is reached as `http://backend:8000` via Docker Compose service name. Both services share `dokploy-network`, so nginx can resolve and connect to the backend.

## Frontend API usage

The React app uses relative URLs so it works in dev and production:

```typescript
const API_BASE = '/api'

fetch(`${API_BASE}/health`)  // → /api/health → nginx → backend:8000/health
```

- **Development**: Vite dev server proxies `/api` to `localhost:8000`
- **Production**: nginx proxies `/api` to `backend:8000`

Same code path, different proxy layer.

## Request flow examples

| Browser request | nginx action | Backend receives |
|----------------|---------------|------------------|
| `GET /` | Serve `index.html` | — |
| `GET /assets/index-xxx.js` | Serve static file | — |
| `GET /dashboard` | Serve `index.html` (SPA route) | — |
| `GET /api/health` | Proxy to backend | `GET /health` |
| `GET /api` | Proxy to backend | `GET /` |

## Customization

- **Backend host/port**: Change `proxy_pass http://backend:8000` if the backend service name or port changes
- **API prefix**: To use a different prefix (e.g. `/v1`), update both `nginx.conf` and `src/lib/api.ts`
- **Static caching**: Add `expires` or `add_header Cache-Control` in the `location /` block for stronger caching

