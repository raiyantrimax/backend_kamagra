const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../model/Users.model');
const { generateOTP, sendOTPEmail, sendWelcomeEmail } = require('./email.service');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TOKEN_EXPIRES_IN = '8h';
const OTP_EXPIRES_IN = 10 * 60 * 1000; // 10 minutes in milliseconds

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, __v, ...rest } = user.toObject ? user.toObject() : user;
  return rest;
}

async function registerUser({ username, email, phone, password, role = 'user' }) {
  if (!username || !email || !password) {
    return { success: false, message: 'username, email and password are required' };
  }

  const existing = await User.findOne({ $or: [{ username }, { email }] });
  if (existing) {
    return { success: false, message: 'Username or email already in use' };
  }

  // Generate OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + OTP_EXPIRES_IN);

  const user = new User({ 
    name: username, 
    email, 
    phone, 
    password, 
    role,
    otp,
    otpExpires,
    isEmailVerified: false
  });
  await user.save();

  // Send OTP email
  const emailResult = await sendOTPEmail(email, otp, username);
  if (!emailResult.success) {
    return { success: false, message: 'Failed to send verification email. Please try again.' };
  }

  return { 
    success: true, 
    message: 'Registration successful! Please check your email for OTP verification.',
    userId: user._id,
    email: user.email
  };
}

async function authenticateUser(usernameOrEmail, password) {
  if (!usernameOrEmail || !password) return { success: false, message: 'Missing credentials' };

  // allow login by username or email
  const user = await User.findOne({
    $or: [{ name: usernameOrEmail }, { email: usernameOrEmail }]
  });
  if (!user) return { success: false, message: 'User not found' };

  // Check if email is verified
  if (!user.isEmailVerified) {
    return { success: false, message: 'Please verify your email before logging in' };
  }

  const match = await user.comparePassword(password);
  if (!match) return { success: false, message: 'Invalid credentials' };

  // Update last login
  user.lastLogin = new Date();
  await user.save();

  const token = signToken({ id: user._id, name: user.name, role: user.role });
  return { success: true, token, user: sanitizeUser(user) };
}

async function authenticateAdmin(username, password) {
  if (!username || !password) return { success: false, message: 'Missing credentials' };

  const admin = await User.findOne({ name: username, role: 'admin' });
  if (!admin) return { success: false, message: 'Admin not found' };

  const match = await admin.comparePassword(password);
  if (!match) return { success: false, message: 'Invalid credentials' };

  const token = signToken({ id: admin._id, name: admin.name, role: 'admin' });
  return { success: true, token, admin: sanitizeUser(admin) };
}

async function verifyOTP(email, otp) {
  if (!email || !otp) {
    return { success: false, message: 'Email and OTP are required' };
  }

  const user = await User.findOne({ email });
  if (!user) {
    return { success: false, message: 'User not found' };
  }

  if (user.isEmailVerified) {
    return { success: false, message: 'Email already verified' };
  }

  if (!user.otp || !user.otpExpires) {
    return { success: false, message: 'OTP not found. Please request a new one.' };
  }

  if (new Date() > user.otpExpires) {
    return { success: false, message: 'OTP has expired. Please request a new one.' };
  }

  if (user.otp !== otp) {
    return { success: false, message: 'Invalid OTP' };
  }

  // Mark email as verified and clear OTP
  user.isEmailVerified = true;
  user.otp = undefined;
  user.otpExpires = undefined;
  await user.save();

  // Send welcome email
  await sendWelcomeEmail(user.email, user.name);

  // Generate token
  const token = signToken({ id: user._id, name: user.name, role: user.role });
  
  return { 
    success: true, 
    message: 'Email verified successfully!',
    token,
    user: sanitizeUser(user)
  };
}

async function resendOTP(email) {
  if (!email) {
    return { success: false, message: 'Email is required' };
  }

  const user = await User.findOne({ email });
  if (!user) {
    return { success: false, message: 'User not found' };
  }

  if (user.isEmailVerified) {
    return { success: false, message: 'Email already verified' };
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + OTP_EXPIRES_IN);

  user.otp = otp;
  user.otpExpires = otpExpires;
  await user.save();

  // Send OTP email
  const emailResult = await sendOTPEmail(email, otp, user.name);
  if (!emailResult.success) {
    return { success: false, message: 'Failed to send OTP email. Please try again.' };
  }

  return { 
    success: true, 
    message: 'OTP resent successfully! Please check your email.'
  };
}

function verifyToken(token) {
  try {
    if (!token) return null;
    const t = token.startsWith('Bearer ') ? token.split(' ')[1] : token;
    return jwt.verify(t, JWT_SECRET);
  } catch (err) {
    return null;
  }
}

module.exports = {
  registerUser,
  authenticateUser,
  authenticateAdmin,
  verifyToken,
  verifyOTP,
  resendOTP
};