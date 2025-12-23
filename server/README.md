# 📧 Email OTP Verification System - Complete Implementation

## 🎯 Overview

This project implements a complete email-based OTP (One-Time Password) verification system for user registration with the following features:

- ✅ Email OTP verification during registration
- ✅ 6-digit OTP codes with 10-minute expiration
- ✅ Professional HTML email templates
- ✅ Resend OTP functionality
- ✅ Welcome email after verification
- ✅ Secure login with email verification check
- ✅ Optional FAQ field in Products model

---

## 📚 Documentation Files

| File | Description |
|------|-------------|
| **QUICK_START.md** | 5-minute quick setup guide |
| **OTP_IMPLEMENTATION_GUIDE.md** | Comprehensive documentation |
| **IMPLEMENTATION_SUMMARY.md** | Summary of all changes |
| **FLOW_DIAGRAM.md** | Visual flow diagrams |
| **postman_collection.json** | Postman API collection |
| **.env.example** | Environment variables template |
| **test-otp-system.js** | Interactive test script |

---

## 🚀 Quick Start

### 1. Install Dependencies
```bash
npm install
```

Dependencies added: `nodemailer`

### 2. Configure Email
Create/edit `.env` file:

```env
# Email Configuration (Required)
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-16-char-app-password

# Other existing variables
MONGODB_URI=mongodb://localhost:27017/your_db
JWT_SECRET=your_secret_key
PORT=5000
```

### 3. Start Server
```bash
npm start
```

### 4. Test the System

**Option A: Use Test Script (Interactive)**
```bash
node test-otp-system.js
```

**Option B: Use Postman**
Import `postman_collection.json` into Postman

**Option C: Use cURL**
See examples in `QUICK_START.md`

---

## 📋 API Endpoints

### 1. Register User
```http
POST /api/users/register
Content-Type: application/json

{
  "username": "johndoe",
  "email": "john@example.com",
  "password": "password123",
  "phone": "1234567890"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Registration successful! Check email for OTP.",
  "userId": "65abc...",
  "email": "john@example.com"
}
```

### 2. Verify OTP
```http
POST /api/users/verify-otp
Content-Type: application/json

{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Response:**
```json
{
  "success": true,
  "message": "Email verified successfully!",
  "token": "eyJhbGc...",
  "user": { ... }
}
```

### 3. Resend OTP
```http
POST /api/users/resend-otp
Content-Type: application/json

{
  "email": "john@example.com"
}
```

### 4. Login
```http
POST /api/users/login
Content-Type: application/json

{
  "identifier": "john@example.com",
  "password": "password123"
}
```

---

## 🏗️ Project Structure

```
server/
├── model/
│   ├── Users.model.js          # Updated with OTP fields
│   └── Products.js             # FAQ now optional
├── services/
│   ├── auth.service.js         # OTP logic added
│   ├── email.service.js        # NEW - Email sending
│   └── products.service.js
├── routes/
│   ├── users.routes.js         # New OTP endpoints
│   ├── products.routes.js
│   └── upload.routes.js
├── middleware/
│   └── upload.js
├── server.js
├── package.json
├── .env.example
├── QUICK_START.md
├── OTP_IMPLEMENTATION_GUIDE.md
├── IMPLEMENTATION_SUMMARY.md
├── FLOW_DIAGRAM.md
├── postman_collection.json
└── test-otp-system.js
```

---

## 🔐 Security Features

- **Password Hashing**: Bcrypt with configurable salt rounds
- **OTP Expiration**: 10 minutes validity
- **Email Verification**: Required before login
- **JWT Tokens**: 8-hour expiration
- **Input Validation**: All endpoints validated
- **Secure OTP Generation**: Random 6-digit codes

---

## 📧 Email Configuration

### Gmail Setup (Recommended)

1. **Enable 2-Factor Authentication**
   - Go to: https://myaccount.google.com/security
   - Enable 2-Step Verification

2. **Generate App Password**
   - Go to: https://myaccount.google.com/apppasswords
   - Select "Mail" and "Other (Custom name)"
   - Copy the 16-character password

3. **Update .env**
   ```env
   EMAIL_SERVICE=gmail
   EMAIL_USER=your-email@gmail.com
   EMAIL_PASSWORD=xxxx xxxx xxxx xxxx
   ```

### Other Email Providers

Supported: Yahoo, Outlook, Hotmail, iCloud, etc.

```env
EMAIL_SERVICE=outlook
EMAIL_USER=your-email@outlook.com
EMAIL_PASSWORD=your-password
```

For custom SMTP:
```env
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
```

---

## 🧪 Testing Guide

### Complete Test Flow

1. **Start Server**
   ```bash
   npm start
   ```

2. **Run Test Script**
   ```bash
   node test-otp-system.js
   ```

3. **Follow Test Steps**
   - Register user → Check email for OTP
   - Verify OTP → Get token
   - Login → Success!

### Manual Testing Checklist

- [ ] Register with valid email
- [ ] Receive OTP email (check spam if needed)
- [ ] Verify OTP successfully
- [ ] Receive welcome email
- [ ] Login with verified account
- [ ] Try login without verification (should fail)
- [ ] Test resend OTP
- [ ] Test expired OTP (wait 10 minutes)
- [ ] Test invalid OTP

---

## 🔄 User Flow

```
1. User registers → Receives OTP email
2. User enters OTP → Email verified
3. System sends welcome email
4. User can login → Access granted
```

**Key Points:**
- OTP expires in 10 minutes
- Can request new OTP anytime
- Email verification required for login
- Professional email templates

---

## 🐛 Troubleshooting

### Email Not Sending

**Problem**: OTP email not received

**Solutions**:
1. Check `.env` file has correct credentials
2. For Gmail, use App Password (not regular password)
3. Check server console for error messages
4. Verify EMAIL_SERVICE matches your provider
5. Check spam/junk folder

### Login Blocked

**Problem**: "Please verify your email before logging in"

**Solutions**:
1. Complete OTP verification first
2. Check database: `isEmailVerified` should be `true`
3. If needed, register again with different email

### OTP Expired

**Problem**: "OTP has expired"

**Solutions**:
1. Use resend OTP endpoint
2. Check system time is correct
3. OTP valid for 10 minutes only

### Server Errors

**Problem**: 500 Internal Server Error

**Solutions**:
1. Check MongoDB is running
2. Verify all environment variables are set
3. Check server logs for specific error
4. Ensure all dependencies installed

---

## 📊 Database Schema

### User Model
```javascript
{
  name: String,
  email: String (unique, indexed),
  password: String (hashed),
  phone: String,
  role: String (enum: 'user', 'admin', 'super_admin'),
  isEmailVerified: Boolean (default: false),
  otp: String,                    // NEW
  otpExpires: Date,               // NEW
  lastLogin: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### Products Model
```javascript
{
  // ... existing fields ...
  faq: {
    title: String,
    content: String (required: false)  // NOW OPTIONAL
  }
}
```

---

## 🎨 Email Templates

### OTP Email
- Professional HTML design
- Large, clear 6-digit code
- Expiration warning
- Security message

### Welcome Email
- Friendly greeting
- Confirmation message
- Support information

Both templates use modern HTML/CSS with responsive design.

---

## 📦 Dependencies

```json
{
  "nodemailer": "^6.x.x",     // NEW - Email sending
  "bcrypt": "^6.0.0",         // Password hashing
  "jsonwebtoken": "^9.0.3",   // JWT tokens
  "mongoose": "^8.18.0",      // MongoDB ODM
  "express": "^5.1.0",        // Web framework
  "cors": "^2.8.5",           // CORS middleware
  "dotenv": "^17.2.1"         // Environment variables
}
```

---

## 🚀 Deployment Considerations

### Environment Variables (Production)
```env
NODE_ENV=production
MONGODB_URI=mongodb+srv://...
JWT_SECRET=use-strong-random-secret-here
EMAIL_SERVICE=gmail
EMAIL_USER=noreply@yourdomain.com
EMAIL_PASSWORD=your-production-app-password
```

### Security Checklist
- [ ] Use strong JWT_SECRET
- [ ] Enable HTTPS
- [ ] Use production email account
- [ ] Set appropriate CORS origins
- [ ] Enable rate limiting
- [ ] Monitor failed login attempts
- [ ] Log security events

---

## 📈 Future Enhancements

Potential improvements:
- [ ] Rate limiting on OTP requests
- [ ] SMS OTP as alternative
- [ ] Configurable OTP expiration
- [ ] OTP attempt limits (max 3 tries)
- [ ] Email template customization
- [ ] Multi-language support
- [ ] Password reset with OTP
- [ ] Two-factor authentication (2FA)
- [ ] Email verification reminders
- [ ] Analytics dashboard

---

## 💡 Tips

1. **Development**: Log OTP to console for easier testing
2. **Testing**: Use a real email you have access to
3. **Gmail**: App Passwords are easier than OAuth2
4. **Security**: Never commit .env file to git
5. **Debugging**: Check server console for detailed logs

---

## 📞 Support

### Resources
- **Quick Start**: See `QUICK_START.md`
- **Full Docs**: See `OTP_IMPLEMENTATION_GUIDE.md`
- **Visual Guide**: See `FLOW_DIAGRAM.md`
- **API Testing**: Import `postman_collection.json`

### Common Issues
- Email configuration → Check `.env.example`
- API endpoints → Check `postman_collection.json`
- Flow understanding → Check `FLOW_DIAGRAM.md`
- Quick setup → Check `QUICK_START.md`

---

## ✅ What's Included

- ✅ Complete OTP email system
- ✅ User registration with verification
- ✅ Secure login flow
- ✅ Resend OTP functionality
- ✅ Professional email templates
- ✅ Comprehensive documentation
- ✅ Testing tools
- ✅ API collection
- ✅ Error handling
- ✅ Security features

---

## 🎉 Ready to Use!

The system is fully implemented and ready for production. Just configure your email credentials and start testing!

**Next Steps:**
1. Add email credentials to `.env`
2. Restart server
3. Run `node test-otp-system.js`
4. Test complete flow
5. Deploy to production

---

**Made with ❤️ for secure user authentication**
