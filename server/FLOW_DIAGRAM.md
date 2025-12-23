# User Registration Flow Diagram

## Complete Registration Flow with OTP Verification

```
┌─────────────────────────────────────────────────────────────────────┐
│                        USER REGISTRATION FLOW                        │
└─────────────────────────────────────────────────────────────────────┘

1. REGISTRATION
   ┌──────────┐
   │  Client  │
   └─────┬────┘
         │ POST /api/users/register
         │ {username, email, password, phone}
         ↓
   ┌─────────────┐
   │   Server    │──────→ Generate OTP (6-digit)
   │             │──────→ Save user (isEmailVerified: false)
   │             │──────→ Store OTP + expiration (10 min)
   └──────┬──────┘
          │
          ↓
   ┌──────────────┐
   │ Email Service│──────→ Send OTP Email
   └──────┬───────┘
          │
          ↓
   ┌──────────────┐
   │  User Email  │ ✉️  OTP: 123456 (expires in 10 min)
   └──────────────┘


2. OTP VERIFICATION
   ┌──────────┐
   │  Client  │
   └─────┬────┘
         │ POST /api/users/verify-otp
         │ {email, otp}
         ↓
   ┌─────────────┐
   │   Server    │──────→ Check OTP matches
   │             │──────→ Check not expired
   │             │──────→ Mark isEmailVerified: true
   │             │──────→ Clear OTP fields
   │             │──────→ Generate JWT token
   └──────┬──────┘
          │
          ↓
   ┌──────────────┐
   │ Email Service│──────→ Send Welcome Email
   └──────┬───────┘
          │
          ↓
   ┌──────────┐
   │  Client  │ ← Returns {token, user}
   └──────────┘


3. LOGIN (After Verification)
   ┌──────────┐
   │  Client  │
   └─────┬────┘
         │ POST /api/users/login
         │ {identifier, password}
         ↓
   ┌─────────────┐
   │   Server    │──────→ Check isEmailVerified = true ✓
   │             │──────→ Verify password
   │             │──────→ Generate JWT token
   └──────┬──────┘
          │
          ↓
   ┌──────────┐
   │  Client  │ ← Returns {token, user}
   └──────────┘


4. RESEND OTP (if needed)
   ┌──────────┐
   │  Client  │
   └─────┬────┘
         │ POST /api/users/resend-otp
         │ {email}
         ↓
   ┌─────────────┐
   │   Server    │──────→ Generate new OTP
   │             │──────→ Update OTP + expiration
   └──────┬──────┘
          │
          ↓
   ┌──────────────┐
   │ Email Service│──────→ Send new OTP Email
   └──────────────┘
```

---

## Error Scenarios

```
┌──────────────────────────────────────────────────────────────┐
│                      ERROR HANDLING                          │
└──────────────────────────────────────────────────────────────┘

Registration:
   ❌ Email exists → "Username or email already in use"
   ❌ Missing fields → "username, email and password are required"
   ❌ Email fails → "Failed to send verification email"

OTP Verification:
   ❌ Wrong OTP → "Invalid OTP"
   ❌ Expired OTP → "OTP has expired. Please request a new one"
   ❌ Already verified → "Email already verified"
   ❌ User not found → "User not found"

Login:
   ❌ Not verified → "Please verify your email before logging in"
   ❌ Wrong password → "Invalid credentials"
   ❌ User not found → "User not found"
```

---

## Database State Changes

```
┌────────────────────────────────────────────────────────────────┐
│                   USER DOCUMENT LIFECYCLE                      │
└────────────────────────────────────────────────────────────────┘

STEP 1: Registration
{
  name: "johndoe",
  email: "john@example.com",
  password: "$2b$10$hash...",
  phone: "1234567890",
  role: "user",
  isEmailVerified: false,          ← Not verified yet
  otp: "123456",                    ← OTP stored
  otpExpires: "2025-12-23T10:10:00" ← Expires in 10 min
}

STEP 2: After OTP Verification
{
  name: "johndoe",
  email: "john@example.com",
  password: "$2b$10$hash...",
  phone: "1234567890",
  role: "user",
  isEmailVerified: true,            ← Now verified ✓
  otp: undefined,                   ← OTP cleared
  otpExpires: undefined,            ← Expiry cleared
  lastLogin: "2025-12-23T10:15:00"
}
```

---

## Email Templates

```
┌────────────────────────────────────────────────────────────────┐
│                      OTP EMAIL                                 │
└────────────────────────────────────────────────────────────────┘

Subject: Verify Your Email - OTP Code

┌─────────────────────────────────────┐
│     Email Verification              │
├─────────────────────────────────────┤
│                                     │
│  Hello johndoe!                     │
│                                     │
│  Your OTP code:                     │
│                                     │
│       ┌──────────┐                 │
│       │  123456  │                 │
│       └──────────┘                 │
│                                     │
│  Expires in 10 minutes              │
│                                     │
└─────────────────────────────────────┘


┌────────────────────────────────────────────────────────────────┐
│                    WELCOME EMAIL                               │
└────────────────────────────────────────────────────────────────┘

Subject: Welcome to Our Platform!

┌─────────────────────────────────────┐
│       Welcome!                      │
├─────────────────────────────────────┤
│                                     │
│  Hello johndoe!                     │
│                                     │
│  ✓ Email verified successfully     │
│                                     │
│  You can now enjoy all features!   │
│                                     │
└─────────────────────────────────────┘
```

---

## API Response Flow

```
┌────────────────────────────────────────────────────────────────┐
│                  API RESPONSE EXAMPLES                         │
└────────────────────────────────────────────────────────────────┘

1. Register → OTP Sent
   Status: 201
   {
     "success": true,
     "message": "Registration successful! Check email for OTP.",
     "userId": "65abc...",
     "email": "john@example.com"
   }

2. Verify OTP → Success
   Status: 200
   {
     "success": true,
     "message": "Email verified successfully!",
     "token": "eyJhbGc...",
     "user": { ... }
   }

3. Login → Success
   Status: 200
   {
     "success": true,
     "token": "eyJhbGc...",
     "user": { ... }
   }

4. Login → Not Verified
   Status: 401
   {
     "success": false,
     "message": "Please verify your email before logging in"
   }
```

---

## Time-based Flow

```
┌────────────────────────────────────────────────────────────────┐
│                    TIMING DIAGRAM                              │
└────────────────────────────────────────────────────────────────┘

T+0 sec    │ User registers
           │ ↓
T+1 sec    │ OTP email sent
           │ ↓
T+30 sec   │ User receives email
           │ ↓
T+60 sec   │ User enters OTP
           │ ↓
T+61 sec   │ Email verified ✓
           │ Welcome email sent
           │ ↓
T+90 sec   │ User logs in successfully
           │
           │
T+10 min   │ [Original OTP expires]
           │ (User can request new OTP)
```

---

## Security Flow

```
┌────────────────────────────────────────────────────────────────┐
│                   SECURITY MEASURES                            │
└────────────────────────────────────────────────────────────────┘

Password        → Bcrypt hash (10 rounds)
OTP             → 6-digit random number
OTP Storage     → Plain in DB (short-lived, 10 min)
OTP Expiry      → 10 minutes from generation
Email Check     → Required before login
JWT Token       → Signed with secret, 8h expiry
Email Sending   → Async, doesn't block registration
```
