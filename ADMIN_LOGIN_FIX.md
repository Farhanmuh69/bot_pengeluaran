# Admin Login Fix

## Masalah
Admin tidak bisa login dengan username `admin` dan password `admin123`.

## Root Cause
Login function menormalisasi semua input sebagai nomor telepon, termasuk username "admin", sehingga lookup ke database gagal.

## Solusi yang Diterapkan

### 1. Update Login Function
Modified `auth.controller.js` untuk menangani dua jenis login:

```javascript
// Check if logging in as admin (username-based)
if (phoneNumber.toLowerCase() === 'admin') {
    user = await User.findOne({ role: 'admin' });
} else {
    // Regular user login (phone-based)
    phoneNumber = normalizePhoneNumber(phoneNumber);
    user = await User.findOne({ phoneNumber });
}
```

### 2. Admin User Creation
Admin user dibuat otomatis saat server start di `index.js`:

```javascript
// Create admin user if not exists
await createAdminIfNotExists();
```

Admin user memiliki:
- **phoneNumber**: `'admin'` (bukan nomor telepon asli)
- **name**: `'Administrator'`
- **password**: dari `.env` (`ADMIN_PASSWORD`) atau default `'admin123'`
- **role**: `'admin'`

### 3. Manual Admin Creation Script
Created `scripts/createAdmin.js` untuk membuat atau reset admin secara manual.

## Cara Login Admin

### Via Web Interface
1. Buka http://localhost:3000
2. **Username**: `admin`
3. **Password**: `admin123` (atau sesuai `ADMIN_PASSWORD` di `.env`)
4. Klik Login
5. Akan redirect ke `/admin`

### Credentials
```
Username: admin
Password: admin123
```

## Testing

### 1. Restart Server
```bash
# Stop server (Ctrl+C)
npm start
```

Server akan otomatis membuat admin user jika belum ada.

### 2. Cek Log Server
Saat server start, harusnya muncul:
```
✅ Admin user created
   Username: admin
   Password: admin123
```

Atau jika sudah ada:
```
(tidak ada pesan, admin sudah ada)
```

### 3. Test Login
1. Buka http://localhost:3000
2. Input:
   - Username: `admin`
   - Password: `admin123`
3. Klik Login
4. Seharusnya redirect ke `/admin`

### 4. Manual Admin Reset (Jika Perlu)
Jika login masih gagal, jalankan script manual:

```bash
node scripts/createAdmin.js
```

Script ini akan:
- Cek apakah admin sudah ada
- Jika sudah ada, reset password
- Jika belum ada, buat admin baru
- Tampilkan credentials

## Troubleshooting

### Error: "Username/nomor atau password salah"

**Kemungkinan 1: Admin belum dibuat**
```bash
# Jalankan script manual
node scripts/createAdmin.js
```

**Kemungkinan 2: Password salah**
- Cek `.env` file, pastikan `ADMIN_PASSWORD=admin123`
- Atau gunakan password yang ada di `.env`

**Kemungkinan 3: Database connection issue**
- Cek MongoDB connection
- Pastikan `MONGODB_URI` di `.env` benar

### Cek Admin di Database
Jika punya akses ke MongoDB:

```javascript
// Di MongoDB shell atau Compass
db.users.findOne({ role: 'admin' })
```

Harusnya return:
```json
{
  "_id": "...",
  "phoneNumber": "admin",
  "name": "Administrator",
  "password": "$2a$10$...", // hashed
  "role": "admin",
  "isActive": true
}
```

## File yang Dimodifikasi
- [auth.controller.js](file:///d:/Bot-pengeluaran/src/controllers/auth.controller.js) - Updated login function
- [createAdmin.js](file:///d:/Bot-pengeluaran/scripts/createAdmin.js) - New admin creation script

## Environment Variables
Pastikan di `.env`:
```bash
ADMIN_PASSWORD=admin123
```

Jika ingin ganti password admin, ubah value ini lalu restart server atau jalankan `node scripts/createAdmin.js`.
