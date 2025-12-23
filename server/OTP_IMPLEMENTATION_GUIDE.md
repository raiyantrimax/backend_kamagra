# Email OTP Verification System - Implementation Guide

## Overview
This implementation adds email-based OTP (One-Time Password) verification for user registration and makes the FAQ field optional in the Products model.

## Features Added

### 1. Email OTP Verification
- Users receive a 6-digit OTP via email upon registration
- OTP expires after 10 minutes
- Users must verify their email before logging in
- Resend OTP functionality available
- Welcome email sent after successful verification

### 2. Product FAQ Optional
- FAQ field in Products model is now optional
- Products can be created without FAQ content

## Setup Instructions

### 1. Install Dependencies
Already installed: `nodemailer`

### 2. Configure Environment Variables
Create a `.env` file in the server directory with the following variables:

```env
# Email Configuration
EMAIL_SERVICE=gmail
EMAIL_USER=your-email@gmail.com
EMAIL_PASSWORD=your-app-specific-password
```

#### Gmail Setup (Recommended):
1. Enable 2-Factor Authentication on your Gmail account
2. Go to: https://myaccount.google.com/apppasswords
3. Generate an App Password for "Mail"
4. Use this 16-character password in `EMAIL_PASSWORD`

#### Other Email Services:
Nodemailer supports: Gmail, Yahoo, Outlook, Hotmail, iCloud, etc.

For custom SMTP:
```env
EMAIL_HOST=smtp.example.com
EMAIL_PORT=587
EMAIL_USER=your-email@example.com
EMAIL_PASSWORD=your-password
```

## API Endpoints

### 1. User Registration
**POST** `/api/users/register`

**Request Body:**
```json
{
  "username": "johndoe",
  "email": "john@example.com",
  "phone": "+1234567890",
  "password": "securePassword123"
}
```

**Success Response (201):**
```json
{
  "success": true,
  "message": "Registration successful! Please check your email for OTP verification.",
  "userId": "65abc123...",
  "email": "john@example.com"
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Username or email already in use"
}
```

### 2. Verify OTP
**POST** `/api/users/verify-otp`

**Request Body:**
```json
{
  "email": "john@example.com",
  "otp": "123456"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "Email verified successfully!",
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "65abc123...",
    "name": "johndoe",
    "email": "john@example.com",
    "role": "user",
    "isEmailVerified": true
  }
}
```

**Error Responses:**
- Invalid OTP: `{"success": false, "message": "Invalid OTP"}`
- Expired OTP: `{"success": false, "message": "OTP has expired. Please request a new one."}`
- Already verified: `{"success": false, "message": "Email already verified"}`

### 3. Resend OTP
**POST** `/api/users/resend-otp`

**Request Body:**
```json
{
  "email": "john@example.com"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "message": "OTP resent successfully! Please check your email."
}
```

### 4. User Login (Modified)
**POST** `/api/users/login`

**Request Body:**
```json
{
  "identifier": "john@example.com",  // email or username
  "password": "securePassword123"
}
```

**Success Response (200):**
```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "_id": "65abc123...",
    "name": "johndoe",
    "email": "john@example.com",
    "role": "user"
  }
}
```

**Error Response (401):**
```json
{
  "success": false,
  "message": "Please verify your email before logging in"
}
```

## Database Schema Changes

### User Model Updates
Added fields:
```javascript
{
  otp: String,              // 6-digit OTP code
  otpExpires: Date,         // OTP expiration timestamp
  isEmailVerified: Boolean  // Email verification status (default: false)
}
```

### Products Model Updates
```javascript
faq: {
  title: {
    type: String,
    default: 'FAQ'
  },
  content: {
    type: String,
    trim: true,
    required: false  // NOW OPTIONAL
  }
}
```

## User Registration Flow

1. **User submits registration form**
   - POST `/api/users/register`
   - User data saved with `isEmailVerified: false`
   - OTP generated and stored with expiration

2. **OTP email sent**
   - 6-digit code sent to user's email
   - Valid for 10 minutes

3. **User enters OTP**
   - POST `/api/users/verify-otp`
   - OTP validated and email marked as verified
   - Welcome email sent
   - JWT token returned

4. **User can now login**
   - POST `/api/users/login`
   - Only allowed if email is verified

## Email Templates

### OTP Email
- Professional HTML template
- Clear display of 6-digit OTP
- Expiration warning (10 minutes)
- Security message

### Welcome Email
- Sent after successful verification
- Welcomes user to the platform
- Provides support information

## Error Handling

All endpoints include comprehensive error handling:
- Input validation
- Database errors
- Email sending failures
- Expired/invalid OTP
- Already verified accounts

## Security Features

1. **OTP Expiration**: Codes expire after 10 minutes
2. **Email Verification Required**: Users cannot login without verification
3. **Password Hashing**: Bcrypt with configurable salt rounds
4. **JWT Tokens**: Secure authentication tokens
5. **Input Validation**: All inputs validated before processing

## Testing the Implementation

### Test Registration Flow:
```bash
# 1. Register user
curl -X POST http://localhost:5000/api/users/register \
  -H "Content-Type: application/json" \
  -d '{"username":"testuser","email":"test@example.com","password":"test123","phone":"1234567890"}'

# 2. Check email for OTP (check your inbox)

# 3. Verify OTP
curl -X POST http://localhost:5000/api/users/verify-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","otp":"123456"}'

# 4. Login
curl -X POST http://localhost:5000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{"identifier":"test@example.com","password":"test123"}'
```

### Test Resend OTP:
```bash
curl -X POST http://localhost:5000/api/users/resend-otp \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com"}'
```

## Troubleshooting

### Email Not Sending:
1. Check `.env` file has correct email credentials
2. For Gmail, ensure App Password is used (not regular password)
3. Check console logs for email errors
4. Verify EMAIL_SERVICE matches your provider

### OTP Expired:
- OTPs expire after 10 minutes
- Use resend OTP endpoint to get a new code

### Login Blocked:
- Ensure email is verified first
- Check `isEmailVerified` field in database

## Files Modified/Created

### New Files:
- `server/services/email.service.js` - Email sending service
- `server/.env.example` - Environment variables template

### Modified Files:
- `server/model/Users.model.js` - Added OTP fields
- `server/services/auth.service.js` - Added OTP verification logic
- `server/routes/users.routes.js` - Added OTP endpoints
- `server/model/Products.js` - Made FAQ optional
- `server/package.json` - Added nodemailer dependency

## Future Enhancements

Potential improvements:
- Rate limiting for OTP requests
- SMS OTP as alternative to email
- Configurable OTP expiration time
- OTP attempt limits
- Email templates customization
- Multi-language support for emails
- Password reset with OTP

## Support

For issues or questions:
1. Check environment variables are correctly set
2. Verify email service configuration
3. Check server logs for detailed error messages
4. Ensure MongoDB connection is active
