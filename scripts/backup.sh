#!/bin/bash

# BluePrint Database Backup Script
# سكربت النسخ الاحتياطي لقاعدة البيانات

set -e

# ============================================
# Configuration
# ============================================

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Backup directory
BACKUP_DIR="${BACKUP_DIR:-./backups}"
DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_NAME="blueprint_backup_${DATE}"

# Database configuration from environment
DATABASE_URL="${DATABASE_URL:-}"

# Parse DATABASE_URL if available
if [ -n "$DATABASE_URL" ]; then
    # Extract components from DATABASE_URL
    DB_HOST=$(echo "$DATABASE_URL" | sed -n 's/.*@\([^:]*\):.*/\1/p')
    DB_PORT=$(echo "$DATABASE_URL" | sed -n 's/.*:\([0-9]*\)\/.*/\1/p')
    DB_NAME=$(echo "$DATABASE_URL" | sed -n 's/.*\/\([^?]*\).*/\1/p')
    DB_USER=$(echo "$DATABASE_URL" | sed -n 's/.*\/\/\([^:]*\):.*/\1/p')
    DB_PASS=$(echo "$DATABASE_URL" | sed -n 's/.*:\/\/[^:]*:\([^@]*\)@.*/\1/p')
else
    DB_HOST="${DB_HOST:-localhost}"
    DB_PORT="${DB_PORT:-5432}"
    DB_NAME="${DB_NAME:-blueprint}"
    DB_USER="${DB_USER:-postgres}"
    DB_PASS="${DB_PASS:-}"
fi

# Retention policy (days)
RETENTION_DAYS="${RETENTION_DAYS:-30}"

# ============================================
# Functions
# ============================================

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check if required tools are installed
check_dependencies() {
    log_info "Checking dependencies..."
    
    if ! command -v pg_dump &> /dev/null; then
        log_error "pg_dump is not installed. Please install postgresql-client."
        exit 1
    fi
    
    if ! command -v aws &> /dev/null; then
        log_warning "AWS CLI not found. S3 upload will be disabled."
        AWS_ENABLED=false
    else
        AWS_ENABLED=true
    fi
    
    log_success "Dependencies check passed"
}

# Create backup directory
create_backup_dir() {
    if [ ! -d "$BACKUP_DIR" ]; then
        log_info "Creating backup directory: $BACKUP_DIR"
        mkdir -p "$BACKUP_DIR"
    fi
}

# Create database backup
create_backup() {
    log_info "Starting database backup..."
    
    local BACKUP_FILE="${BACKUP_DIR}/${BACKUP_NAME}.sql"
    local BACKUP_FILE_GZ="${BACKUP_FILE}.gz"
    
    # Set PGPASSWORD environment variable
    export PGPASSWORD="$DB_PASS"
    
    # Create backup with pg_dump
    log_info "Dumping database: $DB_NAME"
    
    pg_dump \
        -h "$DB_HOST" \
        -p "$DB_PORT" \
        -U "$DB_USER" \
        -d "$DB_NAME" \
        --format=plain \
        --no-owner \
        --no-acl \
        --clean \
        --if-exists \
        > "$BACKUP_FILE" 2>/dev/null
    
    if [ $? -eq 0 ]; then
        log_success "Database dump completed"
        
        # Compress backup
        log_info "Compressing backup..."
        gzip -f "$BACKUP_FILE"
        log_success "Backup compressed: $BACKUP_FILE_GZ"
        
        # Get file size
        local SIZE=$(du -h "$BACKUP_FILE_GZ" | cut -f1)
        log_info "Backup size: $SIZE"
        
        # Create checksum
        sha256sum "$BACKUP_FILE_GZ" > "${BACKUP_FILE_GZ}.sha256"
        log_success "Checksum created"
        
        echo "$BACKUP_FILE_GZ"
    else
        log_error "Database dump failed"
        exit 1
    fi
    
    # Unset PGPASSWORD
    unset PGPASSWORD
}

# Upload to S3 (optional)
upload_to_s3() {
    local BACKUP_FILE="$1"
    local S3_BUCKET="${S3_BUCKET:-}"
    local S3_PREFIX="${S3_PREFIX:-backups}"
    
    if [ -z "$S3_BUCKET" ]; then
        log_warning "S3 bucket not configured. Skipping S3 upload."
        return 0
    fi
    
    if [ "$AWS_ENABLED" = false ]; then
        log_warning "AWS CLI not available. Skipping S3 upload."
        return 0
    fi
    
    log_info "Uploading to S3: s3://${S3_BUCKET}/${S3_PREFIX}/"
    
    aws s3 cp "$BACKUP_FILE" "s3://${S3_BUCKET}/${S3_PREFIX}/$(basename $BACKUP_FILE)" \
        --storage-class STANDARD_IA \
        --quiet
    
    if [ $? -eq 0 ]; then
        log_success "Backup uploaded to S3"
    else
        log_error "S3 upload failed"
    fi
}

# Verify backup integrity
verify_backup() {
    local BACKUP_FILE="$1"
    
    log_info "Verifying backup integrity..."
    
    if [ -f "${BACKUP_FILE}.sha256" ]; then
        sha256sum -c "${BACKUP_FILE}.sha256" > /dev/null 2>&1
        
        if [ $? -eq 0 ]; then
            log_success "Backup integrity verified"
            return 0
        else
            log_error "Backup integrity check failed!"
            return 1
        fi
    else
        log_warning "No checksum file found"
        return 0
    fi
}

# Cleanup old backups
cleanup_old_backups() {
    log_info "Cleaning up old backups (retention: ${RETENTION_DAYS} days)..."
    
    local DELETED_COUNT=$(find "$BACKUP_DIR" -name "*.sql.gz" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
    local DELETED_CHECKSUMS=$(find "$BACKUP_DIR" -name "*.sha256" -type f -mtime +$RETENTION_DAYS -delete -print | wc -l)
    
    log_success "Deleted $DELETED_COUNT old backup(s)"
}

# Send notification (optional)
send_notification() {
    local STATUS="$1"
    local BACKUP_FILE="$2"
    local WEBHOOK_URL="${NOTIFICATION_WEBHOOK:-}"
    
    if [ -z "$WEBHOOK_URL" ]; then
        return 0
    fi
    
    local MESSAGE="BluePrint Backup ${STATUS}: $(basename $BACKUP_FILE)"
    
    curl -s -X POST "$WEBHOOK_URL" \
        -H "Content-Type: application/json" \
        -d "{\"text\": \"$MESSAGE\"}" \
        > /dev/null
}

# ============================================
# Main
# ============================================

main() {
    log_info "================================"
    log_info "BluePrint Database Backup"
    log_info "================================"
    log_info "Timestamp: $(date)"
    log_info "Database: $DB_NAME @ $DB_HOST:$DB_PORT"
    log_info "================================"
    
    check_dependencies
    create_backup_dir
    
    BACKUP_FILE=$(create_backup)
    
    if [ -n "$BACKUP_FILE" ]; then
        verify_backup "$BACKUP_FILE"
        upload_to_s3 "$BACKUP_FILE"
        cleanup_old_backups
        send_notification "completed" "$BACKUP_FILE"
        
        log_info "================================"
        log_success "Backup completed successfully!"
        log_info "Backup file: $BACKUP_FILE"
        log_info "================================"
    else
        send_notification "failed" ""
        exit 1
    fi
}

# Run main function
main "$@"
