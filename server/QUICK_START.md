# Quick Start Guide - Email OTP System

## 🚀 Quick Setup (5 minutes)

### Step 1: Configure Email
Edit your `.env` file and add:

```env
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password
```

### Step 2: Restart Server
```bash
cd server
npm start
```

### Step 3: Test Registration

**1. Register a new user:**
```bash
POST http://localhost:5000/api/users/register
Content-Type: application/json

{
  "username": "testuser",
  "email": "your-test-email@gmail.com",
  "password": "password123",
  "phone": "1234567890"
}
```

**2. Check your email for the 6-digit OTP**

**3. Verify the OTP:**
```bash
POST http://localhost:5000/api/users/verify-otp
Content-Type: application/json

{
  "email": "your-test-email@gmail.com",
  "otp": "123456"
}
```

**4. Login:**
```bash
POST http://localhost:5000/api/users/login
Content-Type: application/json

{
  "identifier": "your-test-email@gmail.com",
  "password": "password123"
}
```

## 📧 Gmail App Password Setup

1. Go to your Google Account: https://myaccount.google.com
2. Click "Security" → "2-Step Verification" → Enable it
3. Go back to Security → "App passwords"
4. Select "Mail" and "Other (Custom name)"
5. Copy the 16-character password
6. Paste it in `.env` as `EMAIL_PASSWORD`

## 🔑 Key Changes Summary

### User Registration Flow:
- **Before**: Register → Get token immediately → Login
- **After**: Register → Receive OTP email → Verify OTP → Get token → Login

### New API Endpoints:
- `POST /api/users/verify-otp` - Verify email with OTP
- `POST /api/users/resend-otp` - Request new OTP

### Products:
- FAQ field is now optional (not required)

## ⚠️ Important Notes

1. **Users MUST verify email before login**
2. **OTP expires in 10 minutes**
3. **Use Gmail App Password, not regular password**
4. **Check spam folder if email not received**

## 🧪 Testing Tips

- Use a real email address you have access to
- Check console logs for any email errors
- OTP is logged in server console (for development)
- Use Postman or Thunder Client for API testing

## 📝 Environment Variables Required

```env
# Existing
MONGODB_URI=mongodb://localhost:27017/your_db
JWT_SECRET=your_secret_key

# New (Required for OTP)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-password
```

## 🐛 Common Issues

**Email not sending?**
- Check EMAIL_USER and EMAIL_PASSWORD in .env
- For Gmail, ensure you're using App Password (not regular password)
- Check server console for error messages

**"Please verify your email" error on login?**
- User must verify OTP first
- Check database: `isEmailVerified` should be `true`

**OTP expired?**
- Use resend OTP endpoint to get a new code
- OTP is valid for 10 minutes only

## 📦 Files Changed

**New:**
- `services/email.service.js`

**Modified:**
- `model/Users.model.js`
- `services/auth.service.js`
- `routes/users.routes.js`
- `model/Products.js`

## ✅ Verify Installation

Check if nodemailer is installed:
```bash
npm list nodemailer
```

Should show: `nodemailer@X.X.X`

---

**Need help?** Check `OTP_IMPLEMENTATION_GUIDE.md` for detailed documentation.
