# Quick Deployment Checklist

## ✅ Pre-Deployment Checklist

- [ ] MongoDB Atlas sudah setup
- [ ] Code sudah di-push ke GitHub
- [ ] `.env` tidak ter-commit (check `.gitignore`)
- [ ] `package.json` sudah ada `engines` field
- [ ] `render.yaml` sudah dibuat

## 🚀 Deploy ke Render (Recommended untuk Testing)

### Step 1: Push ke GitHub
```bash
git add .
git commit -m "Ready for deployment"
git push origin main
```

### Step 2: Deploy di Render
1. Buka https://render.com
2. Sign up/Login dengan GitHub
3. Click **"New +"** → **"Web Service"**
4. Connect repository: `bot-pengeluaran`
5. Render akan auto-detect `render.yaml`

### Step 3: Set Environment Variables
Di Render dashboard, tambahkan:

```
MONGODB_URI=mongodb+srv://farhanmuh:AY44d89K7zY4fCyV@note-outcome.kvxo23y.mongodb.net/bot-pengeluaran?retryWrites=true&w=majority
JWT_SECRET=your-super-secret-jwt-key-change-this-in-production
ADMIN_PASSWORD=admin123
WEBSITE_URL=https://bot-pengeluaran.onrender.com
```

> ⚠️ **IMPORTANT**: Ganti `WEBSITE_URL` dengan URL actual setelah deploy!

### Step 4: Deploy!
Click **"Create Web Service"** dan tunggu ~5-10 menit.

---

## 🚂 Deploy ke Railway (Recommended untuk Production)

### Step 1: Install Railway CLI (Optional)
```bash
npm install -g @railway/cli
```

### Step 2: Deploy via Web
1. Buka https://railway.app
2. Sign up dengan GitHub
3. **"New Project"** → **"Deploy from GitHub repo"**
4. Select: `bot-pengeluaran`
5. Railway auto-detect dan deploy

### Step 3: Add Environment Variables
Di Railway dashboard → Variables:
```
MONGODB_URI=...
JWT_SECRET=...
ADMIN_PASSWORD=...
WEBSITE_URL=https://your-app.up.railway.app
```

### Step 4: Get URL
Railway akan generate URL: `https://bot-pengeluaran-production.up.railway.app`

Update `WEBSITE_URL` dengan URL ini!

---

## 📋 Post-Deployment Tasks

### 1. Update WEBSITE_URL
Setelah dapat URL dari Render/Railway, update environment variable:
```
WEBSITE_URL=https://your-actual-url.com
```

### 2. Test Deployment
```bash
# Health check
curl https://your-app.onrender.com

# Test admin login
curl -X POST https://your-app.onrender.com/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"phoneNumber":"admin","password":"admin123"}'
```

### 3. Scan WhatsApp QR Code
1. Buka `https://your-app.onrender.com/admin`
2. Login: `admin` / `admin123`
3. Scan QR code di WhatsApp Bot Connection section

### 4. Test Bot
Kirim pesan ke WhatsApp:
```
keluar 10000 test deployment
```

### 5. Setup Keep-Alive (Render Only)
**Option A: Cron-Job.org**
1. Buka https://cron-job.org
2. Create job:
   - URL: `https://your-app.onrender.com`
   - Interval: Every 10 minutes

**Option B: UptimeRobot**
1. Buka https://uptimerobot.com
2. Add monitor:
   - Type: HTTP(s)
   - URL: `https://your-app.onrender.com`
   - Interval: 5 minutes

---

## 🔧 Troubleshooting

### Issue: Build Failed
**Check**:
- Node version compatibility
- All dependencies in `package.json`
- No syntax errors

**Solution**:
```bash
# Test locally first
npm install
npm start
```

### Issue: App Crashes
**Check Render/Railway logs**:
- MongoDB connection error?
- Missing environment variables?
- Port configuration?

**Solution**:
- Verify all env vars are set
- Check MongoDB IP whitelist: `0.0.0.0/0`

### Issue: WhatsApp Not Connecting
**Solution**:
- Scan QR code di admin panel
- Wait 1-2 minutes for connection
- Check logs for errors

### Issue: OTP Not Sending
**Solution**:
- WhatsApp bot must be connected first
- Check bot status in admin panel
- Verify phone number format

---

## 💰 Cost Estimate

### Render (Free)
- ✅ Free 750 hours/month
- ⚠️ Sleeps after 15 min inactivity
- ⚠️ No persistent storage (WhatsApp session hilang)

### Railway ($5/month)
- ✅ $5 credit/month (enough for small app)
- ✅ Persistent storage
- ✅ No sleep
- ✅ **Recommended for production**

---

## 🎯 Quick Commands

### Git Commands
```bash
# Initial setup
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/username/bot-pengeluaran.git
git push -u origin main

# Updates
git add .
git commit -m "Update features"
git push
```

### Railway CLI (Optional)
```bash
# Login
railway login

# Link project
railway link

# Deploy
railway up

# View logs
railway logs

# Open in browser
railway open
```

---

## 📞 Support

Jika ada masalah:
1. Check logs di Render/Railway dashboard
2. Verify environment variables
3. Test MongoDB connection
4. Check WhatsApp bot status

**Resources**:
- Render Docs: https://render.com/docs
- Railway Docs: https://docs.railway.app
- WhatsApp Web.js: https://wwebjs.dev

---

## ✨ Success Criteria

Deployment berhasil jika:
- ✅ App accessible via URL
- ✅ Admin bisa login
- ✅ WhatsApp QR code muncul
- ✅ Bot bisa terima pesan
- ✅ User bisa registrasi
- ✅ Dashboard berfungsi

**Selamat! Bot Pengeluaran sudah online! 🎉**
