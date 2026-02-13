# Bot Pengeluaran - WhatsApp Expense Tracker

Sistem pencatatan pengeluaran otomatis via WhatsApp dengan dashboard web.

## 🚀 Features

- ✅ **WhatsApp Bot** - Catat pengeluaran via chat
- ✅ **OTP Registration** - Daftar dengan verifikasi WhatsApp
- ✅ **OTP Login** - Login tanpa password
- ✅ **User Dashboard** - Lihat statistik & export data
- ✅ **Admin Panel** - Kelola user & database
- ✅ **Real-time Updates** - Socket.IO integration

## 📋 Requirements

- Node.js >= 18.0.0
- MongoDB (Atlas recommended)
- WhatsApp account

## 🛠️ Installation

```bash
# Clone repository
git clone https://github.com/username/bot-pengeluaran.git
cd bot-pengeluaran

# Install dependencies
npm install

# Setup environment
cp .env.example .env
# Edit .env dengan credentials Anda

# Start server
npm start
```

## 🌐 Deployment

### Quick Deploy to Render (Free)
1. Push code ke GitHub
2. Buka https://render.com
3. New Web Service → Connect repo
4. Set environment variables
5. Deploy!

### Deploy to Railway (Production)
1. Buka https://railway.app
2. New Project → Deploy from GitHub
3. Select repository
4. Add environment variables
5. Deploy!

**Panduan lengkap**: Lihat [DEPLOYMENT_CHECKLIST.md](DEPLOYMENT_CHECKLIST.md)

## 📱 Usage

### Register
1. Buka `http://localhost:3000/register`
2. Masukkan nomor WhatsApp
3. Terima OTP via WhatsApp
4. Lengkapi data & daftar

### Catat Pengeluaran
Kirim pesan ke WhatsApp bot:
```
keluar 25000 makan siang
keluar 50000 bensin
keluar 100000 belanja
```

### Login
**Via Password**:
- Nomor WhatsApp + Password

**Via OTP**:
- Nomor WhatsApp → Terima OTP → Login

### Admin
- URL: `http://localhost:3000/admin`
- Username: `admin`
- Password: `admin123` (atau sesuai `.env`)

## 🔧 Configuration

Edit `.env`:
```bash
MONGODB_URI=mongodb+srv://...
JWT_SECRET=your-secret-key
ADMIN_PASSWORD=admin123
WEBSITE_URL=http://localhost:3000
PORT=3000
```

## 📚 Documentation

- [Deployment Guide](DEPLOYMENT_CHECKLIST.md) - Deploy ke hosting gratis
- [Admin Login Fix](ADMIN_LOGIN_FIX.md) - Troubleshooting admin login
- [OTP Troubleshooting](OTP_TROUBLESHOOTING.md) - Fix OTP issues

## 🏗️ Tech Stack

- **Backend**: Node.js, Express
- **Database**: MongoDB
- **WhatsApp**: whatsapp-web.js
- **Auth**: JWT, bcrypt
- **Frontend**: Vanilla JS, Socket.IO

## 📸 Screenshots

### Login Page
![Login](docs/login.png)

### Admin Dashboard
![Admin](docs/admin.png)

### User Dashboard
![Dashboard](docs/dashboard.png)

## 🤝 Contributing

Contributions welcome! Please:
1. Fork repository
2. Create feature branch
3. Commit changes
4. Push to branch
5. Create Pull Request

## 📄 License

ISC

## 👨‍💻 Author

Your Name

## 🙏 Acknowledgments

- whatsapp-web.js team
- MongoDB Atlas
- Render/Railway hosting

---

**Made with ❤️ for easier expense tracking**
