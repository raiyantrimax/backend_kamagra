# Forgot Password Feature - Quick Reference

## 🚀 Quick Start

### 1. Request Password Reset OTP
```bash
POST /api/users/forgot-password
Content-Type: application/json

{
  "email": "user@example.com"
}
```

### 2. Reset Password with OTP
```bash
POST /api/users/reset-password
Content-Type: application/json

{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

---

## ⚙️ Key Features

| Feature | Details |
|---------|---------|
| **OTP Expiration** | 10 minutes |
| **Rate Limiting** | 10 minutes between requests |
| **OTP Length** | 6 digits |
| **Min Password Length** | 6 characters |
| **Email Service** | Brevo (GetBrevo) |

---

## 🔄 Complete Flow

```
User Requests Reset
    ↓
System Checks Rate Limit (10 min)
    ↓
Generate 6-digit OTP
    ↓
Save OTP + Expiry in DB
    ↓
Send Email with OTP
    ↓
User Enters OTP + New Password
    ↓
System Validates OTP & Expiry
    ↓
Update Password & Clear OTP
    ↓
Success - User Can Login
```

---

## 📋 Implementation Checklist

- [x] Add OTP fields to User model (already exists)
- [x] Create `sendPasswordResetOTP` email function
- [x] Create `forgotPassword` service function
- [x] Create `resetPasswordWithOTP` service function
- [x] Add `/forgot-password` route
- [x] Add `/reset-password` route
- [x] Implement rate limiting (10 min check)
- [x] Implement OTP expiration (10 min)
- [x] Add password validation (min 6 chars)
- [x] Clear OTP after successful reset
- [x] Create test script
- [x] Create API documentation

---

## 🧪 Testing Commands

### Using cURL:
```bash
# Request OTP
curl -X POST http://localhost:3000/api/users/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com"}'

# Reset Password
curl -X POST http://localhost:3000/api/users/reset-password \
  -H "Content-Type: application/json" \
  -d '{"email": "test@example.com", "otp": "123456", "newPassword": "newPass123"}'
```

### Using Test Script:
```bash
node test-forgot-password.js
```

---

## 🛡️ Security Features

1. **Rate Limiting** - Prevents spam (10 min cooldown)
2. **OTP Expiration** - Auto-expires after 10 minutes
3. **Email Enumeration Prevention** - Same response for all emails
4. **Password Hashing** - Bcrypt with salt rounds
5. **OTP Cleanup** - Cleared after successful reset

---

## 📝 Code Locations

| Component | File Path |
|-----------|-----------|
| Email Function | `services/email.service.js` → `sendPasswordResetOTP()` |
| Forgot Password Logic | `services/auth.service.js` → `forgotPassword()` |
| Reset Password Logic | `services/auth.service.js` → `resetPasswordWithOTP()` |
| Routes | `routes/users.routes.js` |
| User Model | `model/Users.model.js` |
| Test Script | `test-forgot-password.js` |
| Full Documentation | `FORGOT_PASSWORD_API.md` |

---

## ⚠️ Common Errors & Solutions

| Error Message | Cause | Solution |
|--------------|-------|----------|
| "Please wait X minute(s)..." | Rate limited | Wait for cooldown period |
| "Invalid OTP" | Wrong OTP entered | Check email for correct OTP |
| "OTP has expired" | More than 10 min passed | Request new OTP |
| "Password must be at least 6 characters" | Password too short | Use longer password |
| Email not received | Email service issue | Check Brevo config & logs |

---

## 🔧 Environment Variables

```env
BREVO_API_KEY=your_api_key_here
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your App Name
JWT_SECRET=your_jwt_secret
BCRYPT_SALT_ROUNDS=10
```

---

## 📊 Database Fields Used

```javascript
User {
  otp: String,           // 6-digit code
  otpExpires: Date,      // Expiration time
  otpLastSentAt: Date    // Last OTP sent time
}
```

---

## 🎯 Frontend Integration Tips

```javascript
// Example: React/Vue/Angular

// Step 1: Request OTP
const requestReset = async (email) => {
  try {
    const response = await fetch('/api/users/forgot-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email })
    });
    const data = await response.json();
    if (data.success) {
      alert('OTP sent! Check your email.');
    }
  } catch (error) {
    console.error(error);
  }
};

// Step 2: Reset Password
const resetPassword = async (email, otp, newPassword) => {
  try {
    const response = await fetch('/api/users/reset-password', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, otp, newPassword })
    });
    const data = await response.json();
    if (data.success) {
      alert('Password reset successful!');
      // Redirect to login
    }
  } catch (error) {
    console.error(error);
  }
};
```

---

## 📞 Need Help?

1. Check [FORGOT_PASSWORD_API.md](./FORGOT_PASSWORD_API.md) for detailed docs
2. Run [test-forgot-password.js](./test-forgot-password.js) for testing
3. Review server logs for errors
4. Verify environment variables are set

---

**Created:** January 2, 2026
