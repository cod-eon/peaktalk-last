#!/bin/bash
# =============================================================================
# PeakTalk — First-Time VDS Setup Script
# =============================================================================
# Run this ONCE on a fresh Ubuntu 22.04 / 24.04 VDS to:
#   1. Install Docker + Docker Compose
#   2. Install Certbot (for SSL certificates)
#   3. Clone the repository
#   4. Prompt you to fill in environment variables
#   5. Start all services
#
# Usage (run as root or with sudo):
#   curl -fsSL https://raw.githubusercontent.com/YOUR_ORG/peaktalk/main/scripts/setup_vds.sh | bash
#
# Or after cloning:
#   chmod +x scripts/setup_vds.sh && sudo ./scripts/setup_vds.sh
# =============================================================================

set -euo pipefail

# ── Config — change these before running ──────────────────────────────────────
REPO_URL="https://github.com/YOUR_ORG/YOUR_REPO.git"
APP_DIR="/opt/peaktalk"
DOMAIN="YOUR_DOMAIN"         # e.g. peaktalk.io
EMAIL="YOUR_EMAIL"           # e.g. admin@peaktalk.io (for Let's Encrypt)
# ─────────────────────────────────────────────────────────────────────────────

echo ""
echo "=============================================="
echo "  PeakTalk VDS First-Time Setup"
echo "=============================================="

# Must run as root
if [ "$EUID" -ne 0 ]; then
    echo "Please run as root: sudo ./scripts/setup_vds.sh"
    exit 1
fi

# ── 1. System update ──────────────────────────────────────────────────────────
echo ""
echo "[1/7] Updating system packages..."
apt-get update -qq
apt-get upgrade -y -qq

# ── 2. Install Docker ─────────────────────────────────────────────────────────
echo ""
echo "[2/7] Installing Docker..."
if command -v docker &>/dev/null; then
    echo "  Docker already installed: $(docker --version)"
else
    apt-get install -y -qq ca-certificates curl gnupg lsb-release
    install -m 0755 -d /etc/apt/keyrings
    curl -fsSL https://download.docker.com/linux/ubuntu/gpg \
        | gpg --dearmor -o /etc/apt/keyrings/docker.gpg
    chmod a+r /etc/apt/keyrings/docker.gpg
    echo "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] \
        https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" \
        | tee /etc/apt/sources.list.d/docker.list > /dev/null
    apt-get update -qq
    apt-get install -y -qq docker-ce docker-ce-cli containerd.io docker-buildx-plugin docker-compose-plugin
    systemctl enable docker
    systemctl start docker
    echo "  Docker installed: $(docker --version)"
fi

# ── 3. Install Certbot ────────────────────────────────────────────────────────
echo ""
echo "[3/7] Installing Certbot..."
if command -v certbot &>/dev/null; then
    echo "  Certbot already installed: $(certbot --version)"
else
    apt-get install -y -qq certbot
    echo "  Certbot installed: $(certbot --version)"
fi

# ── 4. Clone repository ───────────────────────────────────────────────────────
echo ""
echo "[4/7] Cloning repository..."
if [ -d "$APP_DIR" ]; then
    echo "  Directory $APP_DIR already exists, pulling latest..."
    cd "$APP_DIR"
    git pull origin main
else
    git clone "$REPO_URL" "$APP_DIR"
    cd "$APP_DIR"
fi

# ── 5. Configure environment files ───────────────────────────────────────────
echo ""
echo "[5/7] Setting up environment files..."

if [ ! -f "$APP_DIR/backend/.env" ]; then
    cp "$APP_DIR/backend/.env.example" "$APP_DIR/backend/.env"
    echo ""
    echo "  IMPORTANT: You must edit backend/.env before continuing!"
    echo "  Open the file and fill in all values marked CHANGE_ME:"
    echo ""
    echo "    nano $APP_DIR/backend/.env"
    echo ""
    echo "  Press ENTER when done..."
    read -r
fi

if [ ! -f "$APP_DIR/frontend/.env.local" ]; then
    cp "$APP_DIR/frontend/.env.example" "$APP_DIR/frontend/.env.local"
    echo ""
    echo "  IMPORTANT: You must edit frontend/.env.local before continuing!"
    echo "  Set NEXT_PUBLIC_API_URL=https://$DOMAIN/api and other values:"
    echo ""
    echo "    nano $APP_DIR/frontend/.env.local"
    echo ""
    echo "  Press ENTER when done..."
    read -r
fi

# ── 6. Get SSL certificate ────────────────────────────────────────────────────
echo ""
echo "[6/7] Obtaining SSL certificate for $DOMAIN..."
echo "  (Make sure DNS A record for $DOMAIN points to this server's IP)"
echo ""

if [ -d "/etc/letsencrypt/live/$DOMAIN" ]; then
    echo "  Certificate already exists for $DOMAIN"
else
    # Temporarily start nginx on port 80 for the ACME challenge
    # We use the standalone mode which requires port 80 to be free
    certbot certonly \
        --standalone \
        --non-interactive \
        --agree-tos \
        --email "$EMAIL" \
        -d "$DOMAIN" \
        -d "www.$DOMAIN" || {
            echo ""
            echo "  WARNING: Certificate generation failed."
            echo "  This usually means DNS is not yet pointing to this server."
            echo "  You can get the certificate later with:"
            echo "    certbot certonly --standalone -d $DOMAIN -d www.$DOMAIN"
            echo ""
            echo "  For now, nginx will start without SSL (HTTP only)."
        }
fi

# Update nginx.conf with the actual domain
sed -i "s/YOUR_DOMAIN/$DOMAIN/g" "$APP_DIR/nginx/nginx.conf"
echo "  Updated nginx.conf with domain: $DOMAIN"

# ── 7. Start all services ─────────────────────────────────────────────────────
echo ""
echo "[7/7] Starting all services..."
cd "$APP_DIR"
docker compose build
docker compose run --rm migrate
docker compose up -d

echo ""
echo "  Waiting 10 seconds for services to start..."
sleep 10

echo ""
echo "Running containers:"
docker compose ps

echo ""
echo "=============================================="
echo "  Setup complete!"
echo ""
echo "  Your app should be available at:"
echo "    https://$DOMAIN"
echo ""
echo "  Useful commands:"
echo "    View logs:     docker compose logs -f api"
echo "    Restart:       docker compose restart api"
echo "    Full redeploy: cd $APP_DIR && ./deploy.sh"
echo "=============================================="
