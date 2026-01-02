# Forgot Password API Documentation

## Overview
This documentation covers the forgot password feature that uses OTP (One-Time Password) sent via email for secure password reset.

## Features
- ✅ OTP sent via email for password reset
- ✅ OTP expires after 10 minutes
- ✅ Rate limiting: Cannot request new OTP within 10 minutes of previous request
- ✅ Secure password validation (minimum 6 characters)
- ✅ Email verification before password reset

---

## API Endpoints

### 1. Request Password Reset OTP

**Endpoint:** `POST /api/users/forgot-password`

**Description:** Sends a 6-digit OTP to the user's email for password reset. Includes rate limiting to prevent spam.

**Request Body:**
```json
{
  "email": "user@example.com"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "If an account with that email exists, a password reset OTP has been sent. The OTP will expire in 10 minutes."
}
```

**Error Response - Rate Limited (400 Bad Request):**
```json
{
  "success": false,
  "message": "Please wait 8 minute(s) before requesting a new OTP. An OTP was recently sent to your email."
}
```

**Security Note:** The API returns the same success message whether the email exists or not, preventing email enumeration attacks.

**Rate Limiting Rules:**
- ⏱️ OTP can only be requested once every 10 minutes
- ⏰ OTP expires 10 minutes after generation
- 🔄 After 10 minutes, a new OTP can be requested

---

### 2. Reset Password with OTP

**Endpoint:** `POST /api/users/reset-password`

**Description:** Resets the user's password using the OTP received via email.

**Request Body:**
```json
{
  "email": "user@example.com",
  "otp": "123456",
  "newPassword": "newSecurePassword123"
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Password has been reset successfully. You can now login with your new password."
}
```

**Error Responses:**

**Invalid OTP (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid OTP"
}
```

**Expired OTP (400 Bad Request):**
```json
{
  "success": false,
  "message": "OTP has expired. Please request a new one."
}
```

**Password Too Short (400 Bad Request):**
```json
{
  "success": false,
  "message": "New password must be at least 6 characters long"
}
```

**Missing Fields (400 Bad Request):**
```json
{
  "success": false,
  "message": "Email, OTP, and new password are required"
}
```

**No OTP Request Found (400 Bad Request):**
```json
{
  "success": false,
  "message": "No password reset request found. Please request a new OTP."
}
```

---

## Complete Password Reset Flow

### Step 1: User Requests Password Reset
```bash
curl -X POST http://localhost:3000/api/users/forgot-password \
  -H "Content-Type: application/json" \
  -d '{"email": "user@example.com"}'
```

### Step 2: User Receives Email
The user receives an email with:
- 6-digit OTP code
- 10-minute expiration notice
- Security warning about unsolicited requests

### Step 3: User Resets Password
```bash
curl -X POST http://localhost:3000/api/users/reset-password \
  -H "Content-Type: application/json" \
  -d '{
    "email": "user@example.com",
    "otp": "123456",
    "newPassword": "newSecurePassword123"
  }'
```

### Step 4: User Logs In with New Password
```bash
curl -X POST http://localhost:3000/api/users/login \
  -H "Content-Type: application/json" \
  -d '{
    "identifier": "user@example.com",
    "password": "newSecurePassword123"
  }'
```

---

## Testing Examples

### Example 1: Successful Password Reset
```javascript
// Request OTP
const forgotResponse = await axios.post('/api/users/forgot-password', {
  email: 'user@example.com'
});
// Success: OTP sent to email

// Wait for email and get OTP (e.g., 456789)

// Reset password
const resetResponse = await axios.post('/api/users/reset-password', {
  email: 'user@example.com',
  otp: '456789',
  newPassword: 'myNewPassword123'
});
// Success: Password reset
```

### Example 2: Rate Limiting Test
```javascript
// Request OTP
await axios.post('/api/users/forgot-password', {
  email: 'user@example.com'
});
// Success

// Try requesting again immediately
await axios.post('/api/users/forgot-password', {
  email: 'user@example.com'
});
// Error: "Please wait X minute(s) before requesting a new OTP"
```

### Example 3: Invalid OTP Test
```javascript
await axios.post('/api/users/reset-password', {
  email: 'user@example.com',
  otp: '000000', // Wrong OTP
  newPassword: 'newPassword123'
});
// Error: "Invalid OTP"
```

### Example 4: Expired OTP Test
```javascript
// Request OTP
await axios.post('/api/users/forgot-password', {
  email: 'user@example.com'
});

// Wait more than 10 minutes...

// Try to reset password
await axios.post('/api/users/reset-password', {
  email: 'user@example.com',
  otp: '123456',
  newPassword: 'newPassword123'
});
// Error: "OTP has expired. Please request a new one."
```

---

## Security Features

### 1. OTP Expiration
- ⏰ OTPs expire after 10 minutes
- 🔒 Expired OTPs cannot be used
- 🗑️ OTP is cleared from database after successful password reset

### 2. Rate Limiting
- 🚫 Prevents spam and brute force attacks
- ⏱️ 10-minute cooldown between OTP requests
- 📧 Reduces email service load

### 3. Email Enumeration Prevention
- 🔐 Same response for existing and non-existing emails
- 🛡️ Prevents attackers from discovering valid email addresses

### 4. Password Validation
- ✅ Minimum 6 characters required
- ✅ Password is hashed using bcrypt before storage
- ✅ Old OTP is cleared after successful reset

---

## Database Schema

The User model includes the following OTP-related fields:

```javascript
{
  otp: String,              // 6-digit OTP code
  otpExpires: Date,         // Expiration timestamp
  otpLastSentAt: Date       // Last time OTP was sent (for rate limiting)
}
```

These fields are:
- Set when OTP is requested via `/forgot-password`
- Validated when password is reset via `/reset-password`
- Cleared after successful password reset

---

## Email Template

The password reset email includes:
- 📧 Subject: "Password Reset - OTP Code"
- 🎨 HTML formatted with branding
- 🔢 6-digit OTP code prominently displayed
- ⏰ 10-minute expiration notice
- ⚠️ Security warning for unsolicited requests

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "message": "Descriptive error message"
}
```

Common HTTP status codes:
- `200` - Success
- `400` - Bad request (validation error, expired OTP, etc.)
- `500` - Server error

---

## Best Practices

### For Frontend Developers:
1. ✅ Display clear error messages to users
2. ✅ Show countdown timer for rate limiting
3. ✅ Validate password strength before submission
4. ✅ Provide feedback on OTP format (6 digits)
5. ✅ Handle expired OTP gracefully

### For Backend Developers:
1. ✅ Monitor OTP email delivery rates
2. ✅ Log failed password reset attempts
3. ✅ Set up alerts for unusual activity
4. ✅ Regularly clean up expired OTP records
5. ✅ Test email service configuration

---

## Environment Variables Required

```env
# Email Service (Brevo)
BREVO_API_KEY=your_brevo_api_key
EMAIL_FROM=noreply@yourdomain.com
EMAIL_FROM_NAME=Your App Name

# JWT Secret (for authentication)
JWT_SECRET=your_jwt_secret

# Optional: Bcrypt salt rounds
BCRYPT_SALT_ROUNDS=10
```

---

## Testing

Run the test script:
```bash
node test-forgot-password.js
```

Or use Postman/Thunder Client with the provided examples above.

---

## Troubleshooting

### Issue: OTP email not received
**Solutions:**
- Check Brevo API key is configured
- Verify email sender is authorized in Brevo
- Check spam/junk folder
- Review server logs for email errors

### Issue: "Please wait X minutes" error
**Solution:**
- Wait for the cooldown period to expire
- This is intentional rate limiting

### Issue: "Invalid OTP" error
**Solutions:**
- Ensure OTP is typed correctly (6 digits)
- Request a new OTP if expired
- Check if OTP was already used

### Issue: Password reset not working
**Solutions:**
- Verify OTP hasn't expired (10 minutes)
- Ensure password meets minimum requirements (6 chars)
- Check server logs for errors

---

## Support

For issues or questions, please:
1. Check the server logs
2. Review this documentation
3. Test with the provided test script
4. Contact the development team

---

**Last Updated:** January 2, 2026
