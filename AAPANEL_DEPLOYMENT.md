# Deploy Bot Pengeluaran ke aaPanel

## Prerequisites

### 1. VPS Requirements
- **OS**: Ubuntu 20.04/22.04 atau CentOS 7/8
- **RAM**: Minimal 1GB (recommended 2GB)
- **Storage**: Minimal 10GB
- **CPU**: 1 core minimum

### 2. aaPanel Installed
Jika belum install aaPanel:

```bash
# Ubuntu/Debian
wget -O install.sh http://www.aapanel.com/script/install-ubuntu_6.0_en.sh && sudo bash install.sh aapanel

# CentOS
wget -O install.sh http://www.aapanel.com/script/install_6.0_en.sh && sudo bash install.sh aapanel
```

Setelah install, catat:
- **Panel URL**: `http://your-ip:7800`
- **Username**: (dari output install)
- **Password**: (dari output install)

---

## Step 1: Setup aaPanel

### 1.1 Login ke aaPanel
1. Buka browser: `http://your-server-ip:7800`
2. Login dengan credentials dari install

### 1.2 Install Required Software
Di aaPanel dashboard, install:

**App Store → Install:**
- ✅ **Nginx** (atau Apache)
- ✅ **PM2 Manager** (untuk Node.js)
- ✅ **Node.js** (versi 18.x atau lebih tinggi)

**Cara install Node.js:**
1. App Store → **Node Version Manager**
2. Install **Node.js 18.x**
3. Set sebagai default

---

## Step 2: Upload Project

### Option A: Via Git (Recommended)

**2.1 Install Git di Server**
```bash
# SSH ke server
ssh root@your-server-ip

# Install git
apt install git -y  # Ubuntu
yum install git -y  # CentOS
```

**2.2 Clone Repository**
```bash
# Masuk ke directory web
cd /www/wwwroot

# Clone project
git clone https://github.com/username/bot-pengeluaran.git
cd bot-pengeluaran

# Install dependencies
npm install
```

### Option B: Via Upload File

1. Zip project di local: `bot-pengeluaran.zip`
2. Di aaPanel: **Files** → `/www/wwwroot`
3. Upload zip file
4. Extract zip
5. SSH ke server dan install dependencies:
   ```bash
   cd /www/wwwroot/bot-pengeluaran
   npm install
   ```

---

## Step 3: Setup Environment Variables

### 3.1 Create `.env` File

```bash
# SSH ke server
cd /www/wwwroot/bot-pengeluaran

# Create .env file
nano .env
```

**Paste configuration:**
```bash
# MongoDB Configuration
MONGODB_URI=mongodb+srv://farhanmuh:AY44d89K7zY4fCyV@note-outcome.kvxo23y.mongodb.net/bot-pengeluaran?retryWrites=true&w=majority

# JWT Configuration
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production

# Server Configuration
PORT=3000

# Admin Configuration
ADMIN_PASSWORD=admin123

# Website URL (ganti dengan domain/IP Anda)
WEBSITE_URL=http://your-domain.com
```

**Save:** `Ctrl+O` → Enter → `Ctrl+X`

---

## Step 4: Setup PM2 (Process Manager)

### 4.1 Via aaPanel PM2 Manager

1. **App Store** → **PM2 Manager** → **Settings**
2. **Add Project**:
   - **Project Name**: `bot-pengeluaran`
   - **Project Path**: `/www/wwwroot/bot-pengeluaran`
   - **Startup File**: `index.js`
   - **Port**: `3000`
   - **Run Mode**: `cluster` (optional)
   - **Instances**: `1`

3. Click **Add** → **Start**

### 4.2 Via SSH (Alternative)

```bash
# Install PM2 globally
npm install -g pm2

# Start application
cd /www/wwwroot/bot-pengeluaran
pm2 start index.js --name bot-pengeluaran

# Save PM2 process list
pm2 save

# Setup auto-start on reboot
pm2 startup
# Copy dan jalankan command yang muncul

# Check status
pm2 status
pm2 logs bot-pengeluaran
```

---

## Step 5: Setup Nginx Reverse Proxy

### 5.1 Create Website in aaPanel

1. **Website** → **Add Site**
2. **Domain**: `bot-pengeluaran.yourdomain.com` (atau IP)
3. **Root Directory**: `/www/wwwroot/bot-pengeluaran/public`
4. **PHP Version**: None (kita pakai Node.js)
5. Click **Submit**

### 5.2 Configure Reverse Proxy

1. Klik **Settings** pada website yang baru dibuat
2. **Reverse Proxy** → **Add Reverse Proxy**
3. **Configuration:**
   ```
   Target URL: http://127.0.0.1:3000
   ```
4. **Advanced Settings** (optional):
   ```nginx
   proxy_set_header Host $host;
   proxy_set_header X-Real-IP $remote_addr;
   proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
   proxy_set_header X-Forwarded-Proto $scheme;
   
   # WebSocket support (untuk Socket.IO)
   proxy_http_version 1.1;
   proxy_set_header Upgrade $http_upgrade;
   proxy_set_header Connection "upgrade";
   ```
5. Click **Save**

### 5.3 Manual Nginx Configuration (Alternative)

```bash
# Edit nginx config
nano /www/server/panel/vhost/nginx/yourdomain.conf
```

**Paste:**
```nginx
server {
    listen 80;
    server_name yourdomain.com www.yourdomain.com;
    
    location / {
        proxy_pass http://127.0.0.1:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;
    }
}
```

**Reload Nginx:**
```bash
nginx -t  # Test configuration
nginx -s reload  # Reload
```

---

## Step 6: Setup SSL (HTTPS) - Optional tapi Recommended

### 6.1 Via aaPanel (Let's Encrypt)

1. **Website** → Select your site → **SSL**
2. **Let's Encrypt** tab
3. Enter email
4. Check domain
5. Click **Apply**

aaPanel akan auto-install SSL certificate.

### 6.2 Update Environment

Setelah SSL aktif, update `.env`:
```bash
WEBSITE_URL=https://yourdomain.com
```

Restart PM2:
```bash
pm2 restart bot-pengeluaran
```

---

## Step 7: Setup Firewall

### 7.1 Via aaPanel

1. **Security** → **Firewall**
2. **Add Rule:**
   - **Port**: `3000` (untuk testing langsung)
   - **Protocol**: TCP
   - **Source**: All (atau specific IP)
   - **Action**: Allow

### 7.2 Via UFW (Ubuntu)

```bash
# Allow aaPanel
ufw allow 7800/tcp

# Allow HTTP/HTTPS
ufw allow 80/tcp
ufw allow 443/tcp

# Allow SSH
ufw allow 22/tcp

# Enable firewall
ufw enable
```

---

## Step 8: MongoDB Configuration

### Ensure MongoDB Atlas Whitelist

1. Login ke **MongoDB Atlas**
2. **Network Access** → **Add IP Address**
3. **Allow Access from Anywhere**: `0.0.0.0/0`
   
   Atau tambahkan IP server Anda:
4. **Add Current IP Address** → Paste IP VPS Anda

---

## Step 9: Test Deployment

### 9.1 Check PM2 Status

```bash
pm2 status
pm2 logs bot-pengeluaran --lines 50
```

### 9.2 Test Endpoints

```bash
# Test health
curl http://localhost:3000

# Test via domain
curl http://yourdomain.com

# Test API
curl -X POST http://yourdomain.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"admin","password":"admin123"}'
```

### 9.3 Access Admin Panel

1. Buka browser: `http://yourdomain.com/admin`
2. Login: `admin` / `admin123`
3. Scan WhatsApp QR code

---

## Step 10: Monitoring & Maintenance

### 10.1 PM2 Monitoring

```bash
# View logs
pm2 logs bot-pengeluaran

# Monitor resources
pm2 monit

# Restart app
pm2 restart bot-pengeluaran

# Stop app
pm2 stop bot-pengeluaran

# Delete app
pm2 delete bot-pengeluaran
```

### 10.2 Auto-restart on Crash

PM2 automatically restarts crashed apps. Check config:
```bash
pm2 startup
pm2 save
```

### 10.3 Log Rotation

```bash
# Install PM2 log rotate
pm2 install pm2-logrotate

# Configure (optional)
pm2 set pm2-logrotate:max_size 10M
pm2 set pm2-logrotate:retain 7
```

---

## Troubleshooting

### Issue: Port 3000 Already in Use

```bash
# Find process using port
lsof -i :3000

# Kill process
kill -9 <PID>

# Or change port in .env
PORT=3001
```

### Issue: PM2 Not Starting

```bash
# Check logs
pm2 logs bot-pengeluaran --err

# Common issues:
# 1. Missing dependencies
npm install

# 2. Wrong Node version
node --version  # Should be >= 18

# 3. Permission issues
chown -R www:www /www/wwwroot/bot-pengeluaran
```

### Issue: Nginx 502 Bad Gateway

```bash
# Check if app is running
pm2 status

# Check nginx error log
tail -f /www/wwwlogs/yourdomain.com.error.log

# Restart services
pm2 restart bot-pengeluaran
nginx -s reload
```

### Issue: WhatsApp Not Connecting

```bash
# Check logs
pm2 logs bot-pengeluaran

# Ensure .wwebjs_auth has correct permissions
chown -R www:www /www/wwwroot/bot-pengeluaran/.wwebjs_auth

# Restart app
pm2 restart bot-pengeluaran
```

### Issue: MongoDB Connection Failed

```bash
# Test connection
mongo "mongodb+srv://cluster.mongodb.net/test" --username user

# Check:
# 1. MONGODB_URI correct in .env
# 2. IP whitelisted in MongoDB Atlas
# 3. Network connectivity
ping cluster.mongodb.net
```

---

## Auto-Update Script (Optional)

Create update script:

```bash
nano /www/wwwroot/bot-pengeluaran/update.sh
```

**Content:**
```bash
#!/bin/bash
cd /www/wwwroot/bot-pengeluaran

# Pull latest code
git pull origin main

# Install dependencies
npm install

# Restart PM2
pm2 restart bot-pengeluaran

echo "✅ Update complete!"
```

**Make executable:**
```bash
chmod +x update.sh
```

**Run update:**
```bash
./update.sh
```

---

## Security Best Practices

### 1. Change Default Ports
```bash
# Change aaPanel port (default 7800)
# aaPanel → Settings → Panel Port → 8888
```

### 2. Setup Fail2Ban
```bash
apt install fail2ban -y
systemctl enable fail2ban
systemctl start fail2ban
```

### 3. Regular Updates
```bash
# Update system
apt update && apt upgrade -y

# Update Node.js packages
npm update
```

### 4. Backup
Di aaPanel:
- **Backup** → **Add Backup Task**
- Backup: Database + Files
- Schedule: Daily

---

## Performance Optimization

### 1. Enable Gzip in Nginx

Di aaPanel:
- **Website** → **Settings** → **Performance**
- Enable **Gzip Compression**

### 2. PM2 Cluster Mode

```bash
# Run multiple instances
pm2 start index.js -i max --name bot-pengeluaran
```

### 3. Redis Cache (Advanced)

Install Redis via aaPanel App Store untuk caching.

---

## Summary

✅ **Installed**: aaPanel + Nginx + Node.js + PM2  
✅ **Deployed**: Bot Pengeluaran  
✅ **Configured**: Reverse Proxy + SSL  
✅ **Running**: PM2 with auto-restart  
✅ **Accessible**: `https://yourdomain.com`  

**Access URLs:**
- **Frontend**: `https://yourdomain.com`
- **Admin**: `https://yourdomain.com/admin`
- **API**: `https://yourdomain.com/api/*`

**Management:**
- **aaPanel**: `http://your-ip:7800`
- **PM2**: `pm2 status` via SSH

---

## Quick Commands Reference

```bash
# PM2
pm2 start index.js --name bot-pengeluaran
pm2 restart bot-pengeluaran
pm2 stop bot-pengeluaran
pm2 logs bot-pengeluaran
pm2 monit

# Nginx
nginx -t
nginx -s reload
systemctl restart nginx

# Update app
cd /www/wwwroot/bot-pengeluaran
git pull
npm install
pm2 restart bot-pengeluaran

# View logs
pm2 logs bot-pengeluaran --lines 100
tail -f /www/wwwlogs/yourdomain.com.error.log
```

**Deployment ke aaPanel selesai! 🎉**
