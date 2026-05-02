# Troubleshooting Guide

## 🔍 Common Issues & Solutions

### Backend Issues

#### Port Already in Use (5000)

**Error:**
```
Error: listen EADDRINUSE: address already in use :::5000
```

**Solutions:**

```bash
# Option 1: Kill process on port 5000
# Windows (PowerShell as Admin)
Get-Process -Id (Get-NetTCPConnection -LocalPort 5000).OwningProcess | Stop-Process -Force

# Option 2: Use different port
PORT=5001 npm run dev

# Option 3: List and kill process
lsof -ti:5000 | xargs kill -9
```

#### MongoDB Connection Failed

**Error:**
```
MongoNetworkError: failed to connect to server [localhost:27017]
```

**Solutions:**

```bash
# Check MongoDB is running
mongosh

# Start MongoDB (if not running)
# macOS
brew services start mongodb-community

# Linux
sudo systemctl start mongod

# Windows - Start MongoDB service
net start MongoDB

# Docker
docker run -d -p 27017:27017 mongo:7.0-alpine
```

**Check Connection String:**
```bash
# Verify in .env.local
MONGODB_URI=mongodb://localhost:27017/talent-acquisition

# Or with authentication
MONGODB_URI=mongodb://username:password@localhost:27017/talent-acquisition
```

#### JWT Token Invalid/Expired

**Error:**
```
401 Unauthorized: Invalid token
```

**Solutions:**

```bash
# Clear browser localStorage
# In browser console:
localStorage.clear();

# Refresh page and login again
# Token expires in 7 days by default
```

#### Module Not Found Errors

**Error:**
```
Cannot find module 'dotenv'
```

**Solutions:**

```bash
# Reinstall dependencies
rm -rf node_modules package-lock.json
npm install

# Or with npm cache clean
npm cache clean --force
npm install
```

---

### Frontend Issues

#### API Connection Failed

**Error:**
```
VITE_API_URL is undefined
```

**Solutions:**

```bash
# 1. Create .env.local in Frontend directory
cp .env.example .env.local

# 2. Add correct API URL
VITE_API_URL=http://localhost:5000/api

# 3. Restart dev server
npm run dev
```

#### CORS Error

**Error:**
```
Access to XMLHttpRequest blocked by CORS policy
```

**Solutions:**

```bash
# In Backend .env.local, ensure CORS_ORIGIN matches frontend URL
CORS_ORIGIN=http://localhost:5173
CORS_CREDENTIALS=true

# Restart backend
npm run dev
```

#### TypeScript Errors

**Error:**
```
TS2307: Cannot find module '@/components'
```

**Solutions:**

```bash
# Check tsconfig.json has correct paths configured
# Restart TypeScript server in VS Code
# Ctrl+Shift+P → "TypeScript: Restart TS Server"

# Or rebuild
npm run type-check
```

#### Build Fails

**Error:**
```
Error during build
```

**Solutions:**

```bash
# Clear build cache
rm -rf dist .vite node_modules

# Reinstall and rebuild
npm install
npm run build

# Check for syntax errors
npm run lint --fix
```

---

### Docker Issues

#### Docker Container Fails to Start

**Error:**
```
docker: Error response from daemon
```

**Solutions:**

```bash
# View detailed logs
docker-compose logs backend

# Rebuild images
docker-compose build --no-cache

# Remove and restart
docker-compose down -v
docker-compose up -d
```

#### Port Conflicts with Docker

**Error:**
```
Ports are allocated
```

**Solutions:**

```bash
# Stop all containers
docker-compose down

# Or use different ports in docker-compose.yml
ports:
  - "5001:5000"  # Changed from 5000

# Or kill specific containers
docker ps
docker kill container_id
```

---

### Database Issues

#### Cannot Insert Data

**Error:**
```
MongoError: Duplicate key error
```

**Solutions:**

```bash
# Drop collection and recreate
db.users.drop()

# Or reset entire database
db.dropDatabase()

# Reseed with sample data
npm run seed
```

#### Slow Queries

**Solutions:**

```bash
# Create indexes
db.users.createIndex({ email: 1 })
db.candidates.createIndex({ userId: 1 })

# Check existing indexes
db.users.getIndexes()

# Analyze query performance
db.users.find({email: "test@example.com"}).explain("executionStats")
```

---

### Performance Issues

#### Slow API Response

**Diagnosis:**

```bash
# Check logs for slow queries
tail -f Backend/logs/app.log

# Monitor server resources
# Check CPU and memory usage
```

**Solutions:**

```bash
# 1. Add database indexes
# 2. Implement caching (Redis)
# 3. Optimize queries
# 4. Enable compression in Express

// middleware
app.use(compression());
```

#### Large File Upload Issues

**Error:**
```
413 Payload Too Large
```

**Solutions:**

```bash
# Increase limit in Express
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ limit: '10mb', extended: true }));

# Or configure Multer
const upload = multer({
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});
```

---

## 🆘 Still Having Issues?

### Debug Mode

```bash
# Enable debug logging
DEBUG=app:* npm run dev

# Check specific module
DEBUG=app:services:* npm run dev
```

### Useful Commands

```bash
# Check Node version
node -v

# Check npm version
npm -v

# List running processes
ps aux | grep node

# Check port usage
netstat -tlnp | grep :5000

# View system logs
# Linux
journalctl -xe

# macOS
log stream --process node
```

### Getting Help

1. **Check Error Message** - Read the full error stack
2. **Search Documentation** - Check FAQ and this guide
3. **Check Logs** - Backend logs in `Backend/logs/`
4. **Try Debug Mode** - Use DEBUG environment variable
5. **Isolate Issue** - Test with minimal setup
6. **Create Issue** - Report with reproducible steps

---

**Last Updated**: May 2024 | **Need Help?** Create a GitHub issue with error details
