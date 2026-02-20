# Dokploy Deployment

## Assumptions

- **Frontend**: React Vite SPA built with Bun, served by nginx. Single public entry point.
- **Backend**: FastAPI, internal only. No Traefik labels, no public ports.
- **Routing**: nginx proxies `/api` to backend. Traefik routes all traffic to frontend (port 80).
- **Domain**: Replace `your-domain.com` in Traefik labels with your actual domain.

## Build & Run Locally

```bash
# Create network (Dokploy provides this)
docker network create dokploy-network 2>/dev/null || true

# Build and run
docker compose up --build
```

Frontend will be on port 80 (or the mapped port). Backend is internal.

## Dokploy Setup

1. Create `dokploy-network` if not exists:
   ```bash
   docker network create dokploy-network
   ```

2. Deploy via Dokploy UI: add project, use this `docker-compose.yml`.

3. Set environment variables in Dokploy:
   - `CORS_ORIGINS`: Comma-separated allowed origins (e.g. `https://your-domain.com`)

4. Update Traefik labels in `docker-compose.yml`:
   - Replace `your-domain.com` with your domain
   - Ensure `certResolver=letsencrypt` matches your Traefik config

## Port Rules

- **Frontend**: Exposes port 80 internally. Traefik routes to it.
- **Backend**: No ports exposed. Communicates via `dokploy-network`.

## Service Communication

- Frontend (nginx) proxies `/api` to `http://backend:8000`
- Backend is reachable only from within the Docker network
