# PeakTalk — Deployment Guide

This guide walks you through deploying PeakTalk to a VDS (Ubuntu Linux server) from scratch. No prior DevOps experience required — every command is explained.

---

## Table of Contents

1. [Prerequisites](#1-prerequisites)
2. [Prepare Your VDS](#2-prepare-your-vds)
3. [Set Up the Project on the VDS](#3-set-up-the-project-on-the-vds)
4. [Configure Environment Variables](#4-configure-environment-variables)
5. [SSL Certificate (HTTPS)](#5-ssl-certificate-https)
6. [Start All Services](#6-start-all-services)
7. [Set Up GitHub Actions (Auto-Deploy)](#7-set-up-github-actions-auto-deploy)
8. [Verify Everything Works](#8-verify-everything-works)
9. [Day-to-Day Operations](#9-day-to-day-operations)
10. [Troubleshooting](#10-troubleshooting)

---

## 1. Prerequisites

Before starting, you need:

| What | Where to get it |
|------|----------------|
| A VDS with Ubuntu 22.04 or 24.04 | Any VDS provider (Timeweb, Selectel, Hetzner, etc.) |
| A domain name | Any registrar (REG.RU, nic.ru, Namecheap, etc.) |
| SSH access to your VDS | Your VDS provider's control panel |
| Supabase project | [supabase.com](https://supabase.com) — free tier is fine |
| Gemini API key | [aistudio.google.com](https://aistudio.google.com/app/apikey) |
| hCaptcha site key | [hcaptcha.com](https://dashboard.hcaptcha.com) |
| GitHub account | [github.com](https://github.com) |

**Minimum VDS specs:** 2 vCPU, 2 GB RAM, 20 GB SSD.

---

## 2. Prepare Your VDS

### 2a. Point your domain to the VDS

In your domain registrar's DNS settings, create an **A record**:

```
Type:  A
Name:  @  (or your subdomain, e.g. app)
Value: YOUR_VDS_IP_ADDRESS
TTL:   3600
```

If you want `www.yourdomain.com` to also work, add another A record with `Name: www`.

DNS changes take 5–60 minutes to propagate. You can check with:
```
nslookup yourdomain.com
```

### 2b. SSH into your VDS

On your local computer (Mac/Linux terminal or Windows PowerShell):
```bash
ssh root@YOUR_VDS_IP
```

If you're using an SSH key file:
```bash
ssh -i /path/to/your/key.pem root@YOUR_VDS_IP
```

### 2c. Install Docker

Run these commands on the VDS:

```bash
# Update package list
apt-get update

# Install Docker
curl -fsSL https://get.docker.com | sh

# Verify Docker is running
docker --version
docker compose version
```

Expected output: `Docker version 27.x.x` and `Docker Compose version v2.x.x`

---

## 3. Set Up the Project on the VDS

### 3a. Clone the repository

```bash
# Create a directory for the app
mkdir -p /opt/peaktalk

# Clone your repository (replace with your actual repo URL)
git clone https://github.com/YOUR_ORG/YOUR_REPO.git /opt/peaktalk

# Go into the project directory
cd /opt/peaktalk
```

### 3b. If the repo is private

You'll need to set up a GitHub Deploy Key:

```bash
# Generate an SSH key on the VDS
ssh-keygen -t ed25519 -C "peaktalk-vds" -f /root/.ssh/github_deploy -N ""

# Show the public key — copy this
cat /root/.ssh/github_deploy.pub
```

Then in GitHub: **Your repo → Settings → Deploy keys → Add deploy key**
Paste the public key, check "Allow write access" = OFF.

Then clone using SSH:
```bash
GIT_SSH_COMMAND="ssh -i /root/.ssh/github_deploy" git clone git@github.com:YOUR_ORG/YOUR_REPO.git /opt/peaktalk
```

---

## 4. Configure Environment Variables

### 4a. Backend environment

```bash
cd /opt/peaktalk

# Create the backend .env from the example
cp backend/.env.example backend/.env

# Open and edit the file
nano backend/.env
```

Fill in these values (replace the `CHANGE_ME` and `YOUR_*` placeholders):

| Variable | What to put |
|----------|------------|
| `POSTGRES_PASSWORD` | A strong random password (e.g. `openssl rand -hex 24`) |
| `SUPABASE_URL` | Your Supabase project URL (from Supabase Dashboard → Settings → API) |
| `SUPABASE_KEY` | Your Supabase **service_role** key (from same page) |
| `SUPABASE_STORAGE_BUCKET` | Name of your storage bucket (create it in Supabase → Storage) |
| `GEMINI_API_KEY` | Your Google AI Studio API key |
| `ALLOWED_ORIGINS` | `https://yourdomain.com` (your actual domain, no trailing slash) |
| `SUPABASE_WEBHOOK_SECRET` | A random string: run `openssl rand -hex 32` |

Leave `DATABASE_URL`, `REDIS_URL`, `APP_ENV`, and `DEBUG` as they are — the Docker setup handles them.

To save and exit nano: `Ctrl+O`, `Enter`, `Ctrl+X`.

### 4b. Frontend environment

```bash
# Create the frontend .env.local from the example
cp frontend/.env.example frontend/.env.local

# Edit it
nano frontend/.env.local
```

| Variable | What to put |
|----------|------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Same Supabase URL as above |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | Your Supabase **anon** key (from Dashboard → Settings → API) |
| `NEXT_PUBLIC_API_URL` | `https://yourdomain.com/api` |
| `NEXT_PUBLIC_HCAPTCHA_SITEKEY` | Your hCaptcha site key |

**Important:** `NEXT_PUBLIC_*` variables are baked into the JavaScript bundle at build time. If you change them after building, you must rebuild with `docker compose build frontend`.

---

## 5. SSL Certificate (HTTPS)

Before starting nginx with HTTPS, we need a certificate from Let's Encrypt (free).

### 5a. First start with HTTP only

```bash
cd /opt/peaktalk

# Use the HTTP-only nginx config temporarily
cp nginx/nginx.conf nginx/nginx.conf.backup
cp nginx/nginx.conf.http-only nginx/nginx.conf

# Replace YOUR_DOMAIN in the config
sed -i 's/YOUR_DOMAIN/yourdomain.com/g' nginx/nginx.conf

# Start only the services nginx needs (without the full stack yet)
docker compose up -d postgres redis
docker compose up -d api frontend nginx
```

### 5b. Get the SSL certificate

Install certbot on the VDS host (not inside Docker):

```bash
apt-get install -y certbot

# Get the certificate (replace yourdomain.com with your actual domain)
certbot certonly \
  --webroot \
  --webroot-path=/var/lib/docker/volumes/peaktalk_certbot_webroot/_data \
  --email your@email.com \
  --agree-tos \
  --non-interactive \
  -d yourdomain.com \
  -d www.yourdomain.com
```

If that doesn't work (webroot path not found yet), use standalone mode:
```bash
# Stop nginx first to free port 80
docker compose stop nginx

certbot certonly \
  --standalone \
  --email your@email.com \
  --agree-tos \
  --non-interactive \
  -d yourdomain.com \
  -d www.yourdomain.com

# Restart nginx
docker compose start nginx
```

### 5c. Switch to HTTPS nginx config

```bash
cd /opt/peaktalk

# Restore the full HTTPS config
cp nginx/nginx.conf.backup nginx/nginx.conf

# Replace YOUR_DOMAIN with your actual domain
sed -i 's/YOUR_DOMAIN/yourdomain.com/g' nginx/nginx.conf

# Reload nginx
docker compose restart nginx
```

### 5d. Auto-renew SSL certificate

Let's Encrypt certificates expire after 90 days. Set up automatic renewal:

```bash
# Test that renewal works
certbot renew --dry-run

# Add a cron job to renew weekly
echo "0 3 * * 1 certbot renew --quiet && docker compose -f /opt/peaktalk/docker-compose.yml restart nginx" | crontab -
```

---

## 6. Start All Services

Now start the full stack:

```bash
cd /opt/peaktalk

# Build all Docker images (this takes 3–10 minutes the first time)
docker compose build

# Run database migrations
docker compose run --rm migrate

# Start all services
docker compose up -d

# Check that all containers are running
docker compose ps
```

Expected output — all services should show "running" or "Up":
```
NAME              IMAGE       STATUS
peaktalk-api      ...         Up (healthy)
peaktalk-worker   ...         Up
peaktalk-frontend ...         Up
peaktalk-nginx    ...         Up
peaktalk-postgres ...         Up (healthy)
peaktalk-redis    ...         Up (healthy)
```

Test the API:
```bash
curl http://localhost:8000/health
# Expected: {"status":"ok","service":"peaktalk-api"}
```

Test via your domain:
```bash
curl https://yourdomain.com/health
# Expected: {"status":"ok","service":"peaktalk-api"}
```

Open `https://yourdomain.com` in your browser — the app should load.

---

## 7. Set Up GitHub Actions (Auto-Deploy)

After this step, every time you push code to the `main` branch, GitHub will automatically:
1. Run backend tests
2. SSH into your VDS
3. Pull the new code
4. Build and restart the services

### 7a. Create an SSH key for GitHub

On your **local computer** (not the VDS), generate a dedicated key:

```bash
ssh-keygen -t ed25519 -C "github-actions-peaktalk" -f ~/.ssh/peaktalk_deploy -N ""
```

This creates two files:
- `~/.ssh/peaktalk_deploy` — the **private** key (goes into GitHub Secrets)
- `~/.ssh/peaktalk_deploy.pub` — the **public** key (goes onto the VDS)

### 7b. Add the public key to the VDS

```bash
# Show the public key
cat ~/.ssh/peaktalk_deploy.pub
```

Copy that entire line. Then on the VDS:

```bash
# Add it to authorized keys
echo "PASTE_THE_PUBLIC_KEY_HERE" >> /root/.ssh/authorized_keys
chmod 600 /root/.ssh/authorized_keys
```

### 7c. Add GitHub Secrets

In GitHub: **Your repo → Settings → Secrets and variables → Actions → New repository secret**

Add these 4 secrets:

| Secret name | Value |
|-------------|-------|
| `VDS_HOST` | Your VDS IP address (e.g. `123.45.67.89`) |
| `VDS_USER` | SSH username (usually `root` or `ubuntu`) |
| `VDS_SSH_KEY` | Contents of `~/.ssh/peaktalk_deploy` (the private key — the whole file including `-----BEGIN...` and `-----END...`) |
| `VDS_APP_DIR` | `/opt/peaktalk` |

### 7d. Test the pipeline

Push any small change to `main`:

```bash
git add .
git commit -m "chore: test CI/CD pipeline"
git push origin main
```

Then go to **GitHub repo → Actions** tab and watch the workflow run. It should complete in 3–7 minutes.

If the "Backend Tests" step fails, check the error — it's usually a missing Python package.
If the "Deploy" step fails, check the SSH key was added correctly.

---

## 8. Verify Everything Works

After deployment, run these checks:

```bash
# On the VDS:

# All containers running?
docker compose ps

# API health check
curl http://localhost:8000/health

# Check API logs (last 50 lines)
docker compose logs --tail=50 api

# Check nginx logs
docker compose logs --tail=20 nginx

# Check database connection
docker compose exec postgres psql -U peaktalk -c "SELECT version();"

# Check Alembic migrations are current
docker compose run --rm migrate alembic current
```

Open in browser:
- `https://yourdomain.com` — should show the PeakTalk login page
- `https://yourdomain.com/api/health` — should show `{"status":"ok",...}`

---

## 9. Day-to-Day Operations

### Viewing logs

```bash
# All services
docker compose logs -f

# Specific service
docker compose logs -f api
docker compose logs -f worker
docker compose logs -f frontend
docker compose logs -f nginx

# Last 100 lines of API logs
docker compose logs --tail=100 api
```

### Restarting a service

```bash
# Restart just the API (without rebuilding)
docker compose restart api

# Restart all services
docker compose restart
```

### Manual deploy (without pushing to GitHub)

```bash
cd /opt/peaktalk
./deploy.sh
```

### Running migrations manually

```bash
cd /opt/peaktalk

# Apply all pending migrations
./scripts/migrate.sh

# Check current migration state
./scripts/migrate.sh current

# Show migration history
./scripts/migrate.sh history
```

### Updating environment variables

```bash
# Edit the .env file
nano /opt/peaktalk/backend/.env

# Restart the affected services
docker compose restart api worker
```

For frontend env changes (NEXT_PUBLIC_* vars), you must rebuild:
```bash
nano /opt/peaktalk/frontend/.env.local
docker compose build frontend
docker compose up -d frontend
```

### Backup the database

```bash
# Create a backup
docker compose exec postgres pg_dump -U peaktalk peaktalk > /root/peaktalk_backup_$(date +%Y%m%d).sql

# Restore from backup
docker compose exec -T postgres psql -U peaktalk peaktalk < /root/peaktalk_backup_20241201.sql
```

### Checking disk space

```bash
df -h                          # Overall disk usage
docker system df               # Docker-specific usage
docker compose exec postgres du -sh /var/lib/postgresql/data  # DB size
```

### Cleaning up old Docker images (free disk space)

```bash
# Remove unused images, containers, networks
docker system prune -f

# Also remove unused volumes (CAREFUL — make sure data is backed up first)
docker system prune --volumes -f
```

---

## 10. Troubleshooting

### Container won't start

```bash
# See error details
docker compose logs api
docker compose logs frontend

# Try starting in foreground to see errors live
docker compose up api
```

### API returns 502 Bad Gateway

The FastAPI container isn't running or isn't healthy. Check:
```bash
docker compose ps api
docker compose logs api
curl http://localhost:8000/health
```

### Database connection error

```bash
# Check postgres is running
docker compose ps postgres

# Check the password in .env matches what postgres was initialized with
docker compose logs postgres

# If you changed POSTGRES_PASSWORD after first run, postgres ignores it.
# The password is only set on first container creation.
# To reset: docker compose down -v  (WARNING: deletes all data!)
# Then docker compose up -d postgres and it will re-init with the new password.
```

### Migrations fail

```bash
# Check the error
docker compose run --rm migrate

# Common cause: DATABASE_URL is wrong
# In docker-compose.yml the URL is auto-set to postgres:5432
# Make sure backend/.env has valid POSTGRES_USER/PASSWORD/DB
```

### SSL certificate error / HTTPS not working

```bash
# Check if certificate exists
ls /etc/letsencrypt/live/yourdomain.com/

# Check nginx config is valid
docker compose exec nginx nginx -t

# Check nginx logs
docker compose logs nginx

# Try renewing
certbot renew
docker compose restart nginx
```

### GitHub Actions "Permission denied" SSH error

The SSH key isn't authorized on the VDS. Double-check:
```bash
# On VDS, check authorized keys
cat /root/.ssh/authorized_keys

# Make sure the key from GitHub Secret is there
# Also check permissions
chmod 700 /root/.ssh
chmod 600 /root/.ssh/authorized_keys
```

### "No space left on device"

```bash
# Free up Docker images
docker system prune -f

# Check what's taking space
du -sh /var/lib/docker/*
```

---

## Architecture Reference

```
Internet
    |
    v
[DDoS-Guard / CDN]  (optional, configure DNS to point here)
    |
    v
[Nginx :443]  ← SSL termination, rate limiting
    |
    +──/api/*──> [FastAPI :8000]  ← Business logic, JWT auth
    |                |
    |                +──> [PostgreSQL :5432]  ← User data, sessions
    |                |
    |                +──> [Redis :6379]  ← Task queue
    |                         |
    |                         v
    |                    [Celery Worker]  ← Document parsing
    |
    +──/*──────> [Next.js :3000]  ← Frontend
```

All services run in Docker on the same server and communicate over the `internal` Docker network. Only nginx is exposed to the internet (ports 80 and 443).

---

## GitHub Secrets Summary

| Secret | Description |
|--------|-------------|
| `VDS_HOST` | VDS IP address |
| `VDS_USER` | SSH username (`root` or `ubuntu`) |
| `VDS_SSH_KEY` | Private SSH key for deploy (full contents of the key file) |
| `VDS_APP_DIR` | App directory on VDS (e.g. `/opt/peaktalk`) |

That's it — just 4 secrets to set up fully automated deployments.
