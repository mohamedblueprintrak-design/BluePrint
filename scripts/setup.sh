#!/bin/bash

# ============================================
# BluePrint SaaS - Setup Script
# ============================================
# This script sets up the development environment
# Run: chmod +x scripts/setup.sh && ./scripts/setup.sh

set -e

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}"
echo "╔═══════════════════════════════════════════════════════════════╗"
echo "║           BluePrint SaaS - Setup Script                       ║"
echo "║           نظام إدارة مكاتب الاستشارات الهندسية               ║"
echo "╚═══════════════════════════════════════════════════════════════╝"
echo -e "${NC}"

# ============================================
# Helper Functions
# ============================================

print_step() {
    echo -e "${BLUE}==>${NC} $1"
}

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}!${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

generate_secret() {
    openssl rand -base64 32 | tr -d '\n'
}

generate_hex_key() {
    openssl rand -hex 32
}

# ============================================
# Check Prerequisites
# ============================================

print_step "Checking prerequisites..."

# Check Node.js
if ! command -v node &> /dev/null; then
    print_error "Node.js is not installed. Please install Node.js 18+ first."
    exit 1
fi
NODE_VERSION=$(node -v | cut -d 'v' -f 2 | cut -d '.' -f 1)
if [ "$NODE_VERSION" -lt 18 ]; then
    print_error "Node.js version must be 18 or higher. Current: $(node -v)"
    exit 1
fi
print_success "Node.js $(node -v) found"

# Check npm
if ! command -v npm &> /dev/null; then
    print_error "npm is not installed."
    exit 1
fi
print_success "npm $(npm -v) found"

# Check Docker (optional)
if command -v docker &> /dev/null; then
    print_success "Docker $(docker --version) found"
    HAS_DOCKER=true
else
    print_warning "Docker not found. You'll need a local PostgreSQL database."
    HAS_DOCKER=false
fi

# ============================================
# Environment Setup
# ============================================

print_step "Setting up environment variables..."

if [ -f .env ]; then
    print_warning ".env file already exists. Skipping..."
else
    print_step "Creating .env file..."
    
    # Generate secrets
    JWT_SECRET=$(generate_secret)
    ENCRYPTION_KEY=$(generate_hex_key)
    DB_PASSWORD=$(generate_hex_key | cut -c1-16)
    REDIS_PASSWORD=$(generate_hex_key | cut -c1-16)
    
    cat > .env << EOF
# ============================================
# BluePrint SaaS - Environment Variables
# ============================================
# Generated on $(date)
# SECURITY: Never commit this file to version control!

# Application
NODE_ENV=development
NEXT_PUBLIC_APP_URL=http://localhost:3000
NEXT_PUBLIC_APP_NAME=BluePrint SaaS

# Database
DATABASE_PASSWORD=${DB_PASSWORD}
DATABASE_URL=postgresql://blueprint:${DB_PASSWORD}@localhost:5432/blueprint

# Authentication (Auto-generated - Change in production!)
JWT_SECRET=${JWT_SECRET}

# Encryption Key (Auto-generated - Keep safe!)
ENCRYPTION_KEY=${ENCRYPTION_KEY}

# Redis
REDIS_PASSWORD=${REDIS_PASSWORD}
REDIS_URL=redis://:${REDIS_PASSWORD}@localhost:6379

# Email (Configure for production)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_USER=
SMTP_PASS=
EMAIL_FROM=noreply@yourdomain.com

# Stripe (Add your keys)
STRIPE_SECRET_KEY=
STRIPE_WEBHOOK_SECRET=
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY=

# Rate Limiting
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000
RATE_LIMIT_AUTH_MAX=10

# CORS (Add your domains for production)
CORS_ORIGINS=http://localhost:3000
EOF
    
    print_success ".env file created with secure random secrets"
    print_warning "Please update STRIPE keys and email settings for full functionality"
fi

# ============================================
# Dependencies
# ============================================

print_step "Installing dependencies..."
npm install
print_success "Dependencies installed"

# ============================================
# Database Setup
# ============================================

print_step "Setting up database..."

if [ "$HAS_DOCKER" = true ]; then
    print_step "Starting Docker containers..."
    docker-compose up -d postgres redis
    print_success "Docker containers started"
    
    print_step "Waiting for database to be ready..."
    sleep 5
    
    # Check if database is ready
    for i in {1..30}; do
        if docker-compose exec -T postgres pg_isready -U blueprint > /dev/null 2>&1; then
            print_success "Database is ready"
            break
        fi
        if [ $i -eq 30 ]; then
            print_error "Database failed to start"
            exit 1
        fi
        sleep 1
    done
else
    print_warning "Docker not available. Please ensure PostgreSQL is running locally."
    print_step "You can use the following commands to create the database:"
    echo "  createdb blueprint"
    echo "  or: psql -c 'CREATE DATABASE blueprint;'"
fi

# ============================================
# Prisma Setup
# ============================================

print_step "Running Prisma migrations..."
npx prisma generate
print_success "Prisma client generated"

if [ "$HAS_DOCKER" = true ] || [ -n "$DATABASE_URL" ]; then
    npx prisma db push --accept-data-loss 2>/dev/null || print_warning "Database push skipped (may already exist)"
    print_success "Database schema synchronized"
    
    print_step "Running database seed..."
    npx prisma db seed 2>/dev/null || print_warning "Seed skipped (may have already run)"
fi

# ============================================
# Demo Mode Setup
# ============================================

print_step "Setting up demo mode..."
if [ ! -f .env.demo ]; then
    cat > .env.demo << EOF
# Demo Mode Configuration
DEMO_MODE=true
DEMO_USER_EMAIL=demo@blueprint.dev
DEMO_USER_PASSWORD=demo123456
EOF
    print_success "Demo mode configuration created"
fi

# ============================================
# Verification
# ============================================

print_step "Verifying setup..."

# Check if everything is ready
if [ -f .env ]; then
    print_success "Environment file exists"
else
    print_error "Environment file missing"
fi

if [ -d node_modules ]; then
    print_success "Dependencies installed"
else
    print_error "Dependencies not installed"
fi

# ============================================
# Next Steps
# ============================================

echo ""
echo -e "${GREEN}╔═══════════════════════════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║                    Setup Complete!                            ║${NC}"
echo -e "${GREEN}╚═══════════════════════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${BLUE}Next steps:${NC}"
echo ""
echo "  1. Review and update .env file with your settings"
echo "     - Add Stripe keys for payments"
echo "     - Configure SMTP for emails"
echo ""
echo "  2. Start the development server:"
echo "     ${GREEN}npm run dev${NC}"
echo ""
echo "  3. Or start with Docker:"
echo "     ${GREEN}docker-compose up${NC}"
echo ""
echo "  4. Open http://localhost:3000 in your browser"
echo ""
echo -e "${YELLOW}Security Notes:${NC}"
echo "  - The generated secrets are for development only"
echo "  - Use different, strong secrets in production"
echo "  - Never commit .env to version control"
echo ""
