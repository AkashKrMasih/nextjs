#!/usr/bin/env bash
#
# setup.sh — bootstrap this Next.js + Prisma project on Ubuntu 24.04 (LTS).
#
# What it does:
#   1. Verifies you're on a supported OS and checks for Node.js / npm
#   2. Optionally installs Node.js 20 LTS via NodeSource if missing/too old
#   3. Installs npm dependencies
#   4. Creates .env from .env.example (if not already present)
#   5. Generates a JWT_SECRET and writes it into .env (if not already set)
#   6. Prompts for/validates DATABASE_URL
#   7. Warns if CURRENCY_CODE, CURRENCY_SYMBOL, STRIPE_SECRET_KEY, or
#      STRIPE_PUBLISHABLE_KEY are missing from .env
#   8. Runs prisma migrate dev + prisma generate
#   9. Optionally runs the seed script
#
# Usage:
#   chmod +x setup.sh
#   ./setup.sh
#
set -euo pipefail

MIN_NODE_MAJOR=18
RECOMMENDED_NODE_MAJOR=20

info()  { printf '\033[1;34m[info]\033[0m %s\n' "$1"; }
warn()  { printf '\033[1;33m[warn]\033[0m %s\n' "$1"; }
error() { printf '\033[1;31m[error]\033[0m %s\n' "$1"; }
ok()    { printf '\033[1;32m[ok]\033[0m %s\n' "$1"; }

# ---------------------------------------------------------------------------
# 1. OS check
# ---------------------------------------------------------------------------
if [[ -f /etc/os-release ]]; then
  . /etc/os-release
  info "Detected OS: ${PRETTY_NAME:-unknown}"
  if [[ "${ID:-}" != "ubuntu" ]]; then
    warn "This script is written for Ubuntu 24.04. Detected: ${PRETTY_NAME:-unknown}. Continuing anyway."
  elif [[ "${VERSION_ID:-}" != "24.04" ]]; then
    warn "This script targets Ubuntu 24.04; you're on ${VERSION_ID:-unknown}. Continuing anyway."
  fi
else
  warn "Could not detect OS (missing /etc/os-release). Continuing anyway."
fi

# ---------------------------------------------------------------------------
# 2. Node.js / npm check
# ---------------------------------------------------------------------------
install_node() {
  info "Installing Node.js ${RECOMMENDED_NODE_MAJOR}.x via NodeSource..."
  curl -fsSL "https://deb.nodesource.com/setup_${RECOMMENDED_NODE_MAJOR}.x" | sudo -E bash -
  sudo apt-get install -y nodejs
}

if ! command -v node >/dev/null 2>&1; then
  warn "Node.js not found."
  read -rp "Install Node.js ${RECOMMENDED_NODE_MAJOR}.x now via NodeSource? [y/N] " reply
  if [[ "$reply" =~ ^[Yy]$ ]]; then
    install_node
  else
    error "Node.js is required. Install it manually (nvm, NodeSource, or apt) and re-run this script."
    exit 1
  fi
else
  NODE_MAJOR=$(node -v | sed 's/^v//' | cut -d. -f1)
  if (( NODE_MAJOR < MIN_NODE_MAJOR )); then
    warn "Node.js $(node -v) found, but this project needs ${MIN_NODE_MAJOR}+."
    read -rp "Install Node.js ${RECOMMENDED_NODE_MAJOR}.x now via NodeSource? [y/N] " reply
    if [[ "$reply" =~ ^[Yy]$ ]]; then
      install_node
    else
      error "Please upgrade Node.js manually and re-run this script."
      exit 1
    fi
  else
    ok "Node.js $(node -v) found."
  fi
fi

if ! command -v npm >/dev/null 2>&1; then
  error "npm not found even though Node.js is installed. Check your Node install."
  exit 1
fi
ok "npm $(npm -v) found."

# ---------------------------------------------------------------------------
# 3. Install dependencies
# ---------------------------------------------------------------------------
info "Installing npm dependencies..."
npm install

# ---------------------------------------------------------------------------
# 4. Create .env
# ---------------------------------------------------------------------------
if [[ -f .env ]]; then
  ok ".env already exists, leaving it as-is."
else
  if [[ -f .env.example ]]; then
    cp .env.example .env
    ok "Created .env from .env.example."
  else
    warn ".env.example not found; creating a blank .env."
    touch .env
  fi
fi

# ---------------------------------------------------------------------------
# 5. Generate JWT_SECRET if missing
# ---------------------------------------------------------------------------
if grep -qE '^JWT_SECRET=.+' .env 2>/dev/null; then
  ok "JWT_SECRET already set in .env."
else
  if ! command -v openssl >/dev/null 2>&1; then
    warn "openssl not found; installing it (apt)."
    sudo apt-get update -y && sudo apt-get install -y openssl
  fi
  SECRET=$(openssl rand -base64 32)
  if grep -qE '^JWT_SECRET=' .env 2>/dev/null; then
    sed -i "s|^JWT_SECRET=.*|JWT_SECRET=\"${SECRET}\"|" .env
  else
    printf '\nJWT_SECRET="%s"\n' "$SECRET" >> .env
  fi
  ok "Generated and wrote JWT_SECRET to .env."
fi

# ---------------------------------------------------------------------------
# 6. Check DATABASE_URL
# ---------------------------------------------------------------------------
if grep -qE '^DATABASE_URL=.+' .env 2>/dev/null && ! grep -qE '^DATABASE_URL="?postgresql://USER:PASSWORD@' .env; then
  ok "DATABASE_URL already configured in .env."
else
  warn "DATABASE_URL is missing or still a placeholder in .env."
  echo "  Edit .env and set DATABASE_URL to point at your Postgres/MySQL/SQLite instance,"
  echo "  matching the 'provider' in prisma/schema.prisma. See:"
  echo "  https://www.prisma.io/docs/orm/reference/connection-urls"
  read -rp "Press Enter once DATABASE_URL is set (or Ctrl+C to stop and edit now)... " _
fi

# ---------------------------------------------------------------------------
# 7. Check currency and Stripe configuration
# ---------------------------------------------------------------------------
missing_vars=()

for var in CURRENCY_CODE CURRENCY_SYMBOL STRIPE_SECRET_KEY STRIPE_PUBLISHABLE_KEY; do
  if ! grep -qE "^${var}=.+" .env 2>/dev/null; then
    missing_vars+=("$var")
  fi
done

if (( ${#missing_vars[@]} > 0 )); then
  warn "The following variables are missing from .env: ${missing_vars[*]}"
  echo "  CURRENCY_CODE / CURRENCY_SYMBOL control how prices are displayed (e.g. USD / \$)."
  echo "  STRIPE_SECRET_KEY / STRIPE_PUBLISHABLE_KEY are required for payments (checkout will not work without them)."
  echo "  Get Stripe keys from: https://dashboard.stripe.com/apikeys"
  echo "  See .env.example for the expected format, then add them to .env."
else
  ok "Currency and Stripe configuration found in .env."
fi

# ---------------------------------------------------------------------------
# 8. Prisma: migrate + generate
# ---------------------------------------------------------------------------
if [[ -f prisma/schema.prisma ]]; then
  info "Running prisma migrate dev..."
  npx prisma migrate dev

  info "Running prisma generate..."
  npx prisma generate

  # ---------------------------------------------------------------------
  # 9. Optional seed
  # ---------------------------------------------------------------------
  if grep -q '"seed"' package.json 2>/dev/null || grep -q 'prisma.*seed' package.json 2>/dev/null; then
    read -rp "Seed script detected. Run 'npx prisma db seed' now? [y/N] " reply
    if [[ "$reply" =~ ^[Yy]$ ]]; then
      npx prisma db seed
    fi
  fi
else
  warn "No prisma/schema.prisma found; skipping migrate/generate."
fi

ok "Setup complete. Start the dev server with: npm run dev"