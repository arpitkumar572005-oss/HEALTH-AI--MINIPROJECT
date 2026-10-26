# HealthAI — Production Deployment Guide

This document describes how to deploy HealthAI in production using Docker Compose, PostgreSQL, and Nginx.

---

## 1. Docker Compose Deployment

The recommended production deployment utilizes Docker Compose to orchestrate:
1. **Frontend**: Nginx-served static React bundle with reverse proxy.
2. **Backend**: FastAPI running under Uvicorn workers.
3. **Database**: PostgreSQL 15 Alpine with persistent volume storage.

### Deployment Commands

1. **Configure Environment**:
   ```bash
   cp .env.example .env
   # Edit .env with your production secrets (JWT_SECRET, passwords)
   ```

2. **Build and Launch Containers**:
   ```bash
   docker compose up -d --build
   ```

3. **Verify Container Health**:
   ```bash
   docker compose ps
   docker compose logs -f backend
   ```

The application will be accessible at:
- Web App: `http://<your-server-ip>`
- API Endpoints: `http://<your-server-ip>/api/`
- Health Check: `http://<your-server-ip>/api/health-check`

---

## 2. Security Hardening Checklist

- [x] **No Hardcoded Secrets**: Secrets are pulled exclusively from environment variables.
- [x] **Secure Password Hashing**: Passwords stored using industry-standard salted bcrypt.
- [x] **JWT Token Expiration**: Cryptographically signed access tokens with configurable expiration.
- [x] **SQL Injection Defense**: SQLAlchemy ORM parametrized query builders eliminate SQL injection vectors.
- [x] **CORS Configuration**: Restrict allowed origins to production domains in `backend/app/config.py`.
- [x] **Error Sanitization**: Custom global exception handlers prevent server paths, database errors, or stack traces from reaching client responses.
- [x] **Non-Diagnostic Medical Safeguards**: Disclaimers and non-diagnostic phrasing are enforced at both backend and UI levels.

---

## 3. Reverse Proxy & SSL (HTTPS) Configuration

In production, terminate TLS at a host-level Nginx or Traefik reverse proxy using Let's Encrypt certificates:

```nginx
server {
    listen 443 ssl http2;
    server_name healthai.yourdomain.com;

    ssl_certificate /etc/letsencrypt/live/healthai.yourdomain.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/healthai.yourdomain.com/privkey.pem;

    location / {
        proxy_pass http://127.0.0.1:80;
        proxy_set_header Host $host;
        proxy_set_header X-Forwarded-Proto https;
    }
}
```
