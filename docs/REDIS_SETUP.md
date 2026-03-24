# Redis Configuration Guide for BluePrint SaaS
# دليل تكوين Redis لـ BluePrint SaaS

## Overview | نظرة عامة

BluePrint uses Redis for:
- Rate limiting
- Session storage
- API response caching
- Real-time data caching

## Development Setup | إعداد بيئة التطوير

In development mode, BluePrint automatically falls back to an in-memory cache if Redis is not available. No additional configuration is required.

```bash
# No Redis needed for development
npm run dev
```

## Production Setup | إعداد بيئة الإنتاج

### Option 1: Docker Compose (Recommended)

```yaml
# docker-compose.yml
services:
  redis:
    image: redis:7-alpine
    container_name: blueprint-redis
    restart: unless-stopped
    command: redis-server --requirepass ${REDIS_PASSWORD}
    volumes:
      - redis_data:/data
    ports:
      - "6379:6379"
    healthcheck:
      test: ["CMD", "redis-cli", "-a", "${REDIS_PASSWORD}", "ping"]
      interval: 5s
      timeout: 5s
      retries: 5

volumes:
  redis_data:
```

### Option 2: Managed Redis Services

**AWS ElastiCache:**
```
REDIS_URL=redis://:password@your-cluster.xxxxxx.use1.cache.amazonaws.com:6379
```

**Redis Cloud:**
```
REDIS_URL=redis://default:password@redis-xxxxx.c1.us-east-1-2.ec2.cloud.redislabs.com:6379
```

**Upstash:**
```
REDIS_URL=redis://default:password@global-redis.upstash.io:6379
```

### Option 3: Self-Hosted Redis

```bash
# Ubuntu/Debian
sudo apt update
sudo apt install redis-server

# Configure password
sudo nano /etc/redis/redis.conf
# Uncomment and set: requirepass your_strong_password_here

# Enable and start
sudo systemctl enable redis-server
sudo systemctl start redis-server
```

## Environment Variables | متغيرات البيئة

Add to your `.env.production`:

```env
# Redis Configuration
REDIS_URL=redis://:your_password@redis-host:6379

# Optional: Redis TLS (for cloud providers)
# REDIS_URL=rediss://:password@redis-host:6379
```

### URL Format

```
redis://[:password@]host[:port][/database]
rediss://[:password@]host[:port][/database]  # TLS enabled
```

## Cache Configuration | تكوين التخزين المؤقت

Cache settings can be customized in the application:

```typescript
// src/lib/cache.ts
const DEFAULT_TTL = 3600; // 1 hour

const CACHE_TTL = {
  short: 60,        // 1 minute - for frequently changing data
  medium: 300,      // 5 minutes - for lists
  long: 900,        // 15 minutes - for stats
  xlong: 3600,      // 1 hour - for static data
};
```

## Rate Limiting Configuration | تكوين تحديد المعدل

```env
# Rate Limiting (requests per window)
RATE_LIMIT_MAX=100
RATE_LIMIT_WINDOW_MS=60000  # 1 minute

# Auth endpoints (stricter limits)
RATE_LIMIT_AUTH_MAX=10
RATE_LIMIT_AUTH_WINDOW_MS=60000
```

## Monitoring Redis | مراقبة Redis

### Health Check

```bash
# Check Redis connection
redis-cli -a your_password ping
# Expected: PONG
```

### Memory Usage

```bash
redis-cli -a your_password info memory
```

### Monitoring Commands

```bash
# Connected clients
redis-cli -a your_password client list

# Cache hit rate
redis-cli -a your_password info stats | grep keyspace

# All keys
redis-cli -a your_password keys '*'
```

## Cache Invalidation | إبطال التخزين المؤقت

The application automatically invalidates cache when:
- Entity is created, updated, or deleted
- User permissions change
- Organization settings change

Manual cache clear:
```bash
# Clear all cache with prefix
redis-cli -a your_password KEYS "bp:*" | xargs redis-cli -a your_password DEL
```

## Security Best Practices | أفضل ممارسات الأمان

1. **Always use authentication** in production
   ```conf
   requirepass your_strong_password_here
   ```

2. **Disable dangerous commands**
   ```conf
   rename-command FLUSHALL ""
   rename-command FLUSHDB ""
   rename-command CONFIG ""
   ```

3. **Bind to specific interface**
   ```conf
   bind 127.0.0.1  # or internal network IP
   ```

4. **Use TLS in production**
   ```conf
   tls-cert-file /path/to/redis.crt
   tls-key-file /path/to/redis.key
   ```

5. **Set memory limits**
   ```conf
   maxmemory 256mb
   maxmemory-policy allkeys-lru
   ```

## Troubleshooting | استكشاف الأخطاء

### Connection Refused
```
Error: Redis connection refused
```
Solution: Check if Redis is running and accessible

### Authentication Failed
```
Error: NOAUTH Authentication required
```
Solution: Verify REDIS_PASSWORD matches redis.conf

### Memory Issues
```
Error: OOM command not allowed when used memory > 'maxmemory'
```
Solution: Increase maxmemory or adjust eviction policy

## Performance Tuning | ضبط الأداء

### Production Settings

```conf
# /etc/redis/redis.conf

# Memory
maxmemory 512mb
maxmemory-policy allkeys-lru

# Persistence (optional)
appendonly yes
appendfsync everysec

# Networking
tcp-keepalive 300
timeout 0
```

### Connection Pooling

For high-traffic applications, consider using connection pooling:

```typescript
// Already implemented in src/lib/cache.ts
// Redis client is singleton and reused across requests
```

## Backup Strategy | استراتيجية النسخ الاحتياطي

### RDB Snapshots

```conf
save 900 1     # After 15 min if at least 1 key changed
save 300 10    # After 5 min if at least 10 keys changed
save 60 10000  # After 1 min if at least 10000 keys changed
```

### AOF (Append Only File)

```conf
appendonly yes
appendfsync everysec
```

### Backup Script

```bash
#!/bin/bash
# backup-redis.sh
BACKUP_DIR="/backups/redis"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)

# Create backup
redis-cli -a $REDIS_PASSWORD BGSAVE

# Copy RDB file
cp /var/lib/redis/dump.rdb "$BACKUP_DIR/dump_$TIMESTAMP.rdb"

# Keep only last 7 days
find $BACKUP_DIR -name "dump_*.rdb" -mtime +7 -delete
```
