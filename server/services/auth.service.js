const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../model/Users.model');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TOKEN_EXPIRES_IN = '8h';

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

  const user = new User({ username, email, phone, password, role });
  await user.save();

  const token = signToken({ id: user._id, username: user.username, role: user.role });
  return { success: true, token, user: sanitizeUser(user) };
}

async function authenticateUser(usernameOrEmail, password) {
  if (!usernameOrEmail || !password) return { success: false, message: 'Missing credentials' };

  // allow login by username or email
  const user = await User.findOne({
    $or: [{ username: usernameOrEmail }, { email: usernameOrEmail }]
  });
  if (!user) return { success: false, message: 'User not found' };

  const match = await user.comparePassword(password);
  if (!match) return { success: false, message: 'Invalid credentials' };

  const token = signToken({ id: user._id, username: user.username, role: user.role });
  return { success: true, token, user: sanitizeUser(user) };
}

async function authenticateAdmin(username, password) {
  if (!username || !password) return { success: false, message: 'Missing credentials' };

  const admin = await User.findOne({ username, role: 'admin' });
  if (!admin) return { success: false, message: 'Admin not found' };

  const match = await admin.comparePassword(password);
  if (!match) return { success: false, message: 'Invalid credentials' };

  const token = signToken({ id: admin._id, username: admin.username, role: 'admin' });
  return { success: true, token, admin: sanitizeUser(admin) };
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
  verifyToken
};