# Redis Cloud Setup Guide

This project uses **Redis Cloud** (https://cloud.redis.io/) for caching flight search results and managing session data. Redis Cloud provides a managed Redis service similar to MongoDB Atlas.

---

## Why Redis Cloud?

- **Managed Service**: No need to maintain Redis infrastructure
- **Free Tier**: 30MB storage, perfect for development and testing
- **Global Availability**: Multiple cloud providers (AWS, GCP, Azure)
- **Automatic Backups**: Built-in data persistence
- **SSL/TLS Security**: Encrypted connections by default
- **node-redis Compatible**: Works seamlessly with the official Node.js Redis client

---

## Step 1: Create a Redis Cloud Account

1. Visit **https://cloud.redis.io/**
2. Click **"Get Started Free"** or **"Sign Up"**
3. Sign up with:
   - Google account
   - GitHub account
   - Email + password
4. Verify your email address

---

## Step 2: Create a Free Database

### Option A: Quick Start (Recommended)

1. After login, click **"Create database"**
2. Choose **"Free"** plan (30MB)
3. Select your cloud provider:
   - AWS
   - Google Cloud
   - Azure
4. Select the closest region to your location
5. Enter a database name (e.g., `flight-booking-cache`)
6. Click **"Activate"**

### Option B: Subscription-Based Setup

1. Go to **"Subscriptions"** → **"Create subscription"**
2. Choose **"Fixed"** plan
3. Select **"Free"** tier (30MB, no credit card required)
4. Choose cloud provider and region
5. Name your subscription
6. Click **"Create"**
7. After subscription is created, click **"Add database"**
8. Configure database settings and click **"Activate"**

---

## Step 3: Get Connection Details

1. Navigate to your database in the Redis Cloud dashboard
2. Click on your database name
3. Copy the following connection details:

### Connection Information

```
Public endpoint: <your-redis-host>:<port>
Username: default
Password: <your-redis-password>
```

---

## Step 4: Configure Your Application

### Update `.env` File

Open your `.env` file and update the `REDIS_URL`:

```env
# Redis Cloud Configuration
REDIS_URL=redis://default:YOUR_PASSWORD@YOUR_HOST:YOUR_PORT
```

### Format Breakdown:
```
redis://[username]:[password]@[host]:[port]
```

- **Protocol**: `redis://` (use `rediss://` for explicit TLS)
- **Username**: `default` (Redis Cloud default user)
- **Password**: Your database password (copy from dashboard)
- **Host**: Your public endpoint hostname
- **Port**: Your database port (usually 10000-19999 range)

---

## Step 5: Verify Connection

### Test Connection Script

Create a test file `test-redis.js`:

```javascript
const { createClient } = require('redis');

const client = createClient({
  url: process.env.REDIS_URL || 'redis://localhost:6379'
});

client.on('error', err => console.error('Redis Error:', err));

(async () => {
  try {
    await client.connect();
    console.log('✅ Connected to Redis Cloud');

    // Test SET
    await client.set('test_key', 'Hello Redis Cloud!');
    console.log('✅ SET test_key');

    // Test GET
    const value = await client.get('test_key');
    console.log('✅ GET test_key =>', value);

    // Test with JSON
    await client.set('user:1', JSON.stringify({ name: 'Alice', role: 'admin' }));
    const user = JSON.parse(await client.get('user:1'));
    console.log('✅ JSON stored:', user);

    // Cleanup
    await client.del('test_key', 'user:1');
    
    await client.disconnect();
    console.log('✅ All tests passed!');
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    process.exit(1);
  }
})();
```

Run the test:
```bash
node test-redis.js
```

---

## Step 6: Integration in Your App

Your application automatically connects to Redis on startup through `src/config/redis.js`.

### Start Your Server

```bash
npm run dev
```

### Verify in Logs

You should see:
```
Redis Client Connected
Redis connection established
Server running in development mode on port 3000
```

---

## Redis Cloud Dashboard Features

### 1. **Metrics & Monitoring**
- Real-time operations per second
- Memory usage
- Connected clients
- Hit/miss ratio

### 2. **Data Browser**
- View all keys in your database
- Inspect key values
- Delete keys manually
- Search by pattern

### 3. **Configuration**
- Change password
- Enable/disable commands
- Set eviction policies
- Configure persistence

### 4. **Alerts**
- Set up alerts for high memory usage
- Get notified on connection issues
- Monitor performance degradation

---

## How This Project Uses Redis

### 1. **Flight Search Caching**

Location: `src/services/flight.service.js`

```javascript
// Cache key format:
flights:search:{ORIGIN}:{DESTINATION}:{DATE}:{PASSENGERS}:{CLASS}:{HASH}

// Example:
flights:search:LHR:DXB:2026-10-12:1:economy:a3f8b2c1

// TTL: 300 seconds (5 minutes)
```

**Benefits:**
- Reduces API calls to flight providers
- Faster response times for repeated searches
- Lower costs on metered APIs

### 2. **Session Storage** (Future)

Planned for Phase 6+:
- User session management
- JWT token blacklist
- Rate limiting counters
- Temporary booking holds

---

## Redis Cloud Free Tier Limits

| Resource | Limit |
|---|---|
| **Storage** | 30 MB |
| **Connections** | 30 concurrent |
| **Throughput** | No explicit limit (fair use) |
| **Databases** | 1 per subscription |
| **Replication** | Not available |
| **Backups** | Daily snapshots |

### When to Upgrade:

Upgrade to a paid plan when:
- Storage exceeds 30 MB
- Need more than 30 concurrent connections
- Require high availability (replication)
- Need custom backup schedules
- Production workloads with SLA requirements

---

## Troubleshooting

### Connection Refused

```
Error: connect ECONNREFUSED
```

**Solutions:**
1. Check your firewall/antivirus isn't blocking port
2. Verify `REDIS_URL` format is correct
3. Confirm database is active in Redis Cloud dashboard
4. Try pinging the host: `ping your-redis-host`

### Authentication Failed

```
Error: WRONGPASS invalid username-password pair
```

**Solutions:**
1. Copy password exactly from Redis Cloud dashboard (no extra spaces)
2. Check username is `default`
3. Regenerate password in dashboard if needed

### Timeout Errors

```
Error: Connection timeout
```

**Solutions:**
1. Check your internet connection
2. Verify the host and port are correct
3. Increase `connectTimeout` in `src/config/redis.js`:
   ```javascript
   socket: {
     connectTimeout: 10000  // 10 seconds
   }
   ```

### Memory Exceeded

```
Error: OOM command not allowed when used memory > 'maxmemory'
```

**Solutions:**
1. Clear old cache keys: `DELETE /api/v1/flights/cache`
2. Reduce cache TTL in flight service
3. Upgrade to a larger plan

---

## Security Best Practices

### 1. **Never Commit Credentials**

✅ **Right:**
```bash
# .gitignore
.env
.env.local
```

### 2. **Use Environment Variables**

```javascript
// ✅ Good
const client = createClient({
  url: process.env.REDIS_URL
});

// ❌ Bad
const client = createClient({
  url: 'redis://default:password@host:port'  // Hardcoded!
});
```

### 3. **Rotate Passwords Regularly**

In Redis Cloud dashboard:
1. Go to **Configuration**
2. Click **"Reset password"**
3. Update your `.env` file
4. Restart your application

### 4. **Limit Access**

- Use **IP whitelist** in Redis Cloud (paid plans)
- Enable **TLS/SSL** for production
- Create **separate databases** for dev/staging/prod

---

## Comparison: MongoDB Atlas vs Redis Cloud

| Feature | MongoDB Atlas | Redis Cloud |
|---|---|---|
| **Type** | Document Database | Key-Value Cache |
| **Free Tier** | 512 MB | 30 MB |
| **Use Case** | Persistent data | Temporary caching |
| **Query Language** | MongoDB Query | Redis Commands |
| **Persistence** | Always | Optional |
| **Speed** | Fast (disk-based) | Extremely fast (in-memory) |
| **Complex Queries** | ✅ Yes | ❌ Limited |
| **Relationships** | ✅ Yes | ❌ No |
| **TTL/Expiry** | Manual | Built-in |

### When to Use Each:

**MongoDB Atlas:**
- User accounts
- Task lists
- Booking records
- Transaction history

**Redis Cloud:**
- Flight search results
- Session tokens
- Rate limiting
- Real-time analytics

---

## Additional Resources

- **Official Docs**: https://docs.redis.com/latest/
- **node-redis GitHub**: https://github.com/redis/node-redis
- **Redis Commands**: https://redis.io/commands/
- **Redis Cloud Pricing**: https://redis.com/redis-enterprise-cloud/pricing/
- **Best Practices**: https://redis.io/docs/manual/patterns/

---

## Summary

✅ **Created Redis Cloud account**  
✅ **Created free database (30MB)**  
✅ **Copied connection details**  
✅ **Updated `.env` with `REDIS_URL`**  
✅ **Verified connection works**  
✅ **Server connects on startup**  
✅ **Flight search caching operational**

Your Redis Cloud setup is complete! Flight searches are now cached for 5 minutes, reducing response times and external API calls.

---

**Next Steps:**
- Test flight search endpoints in Thunder Client
- Monitor cache hit/miss ratio in Redis Cloud dashboard
- Clear cache with `DELETE /api/v1/flights/cache` when needed
