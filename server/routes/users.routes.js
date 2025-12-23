const express = require('express');
const router = express.Router();

const authService = require('../services/auth.service');

// POST /api/users/register  -> register new user
router.post('/users/register', async (req, res) => {
  try {
    const { username, email, phone, password } = req.body;
    const result = await authService.registerUser({ username, email, phone, password });
    if (result.success) return res.status(201).json(result);
    return res.status(400).json({ success: false, message: result.message });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/verify-otp  -> verify OTP
router.post('/users/verify-otp', async (req, res) => {
  try {
    const { email, otp } = req.body;
    const result = await authService.verifyOTP(email, otp);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json({ success: false, message: result.message });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/resend-otp  -> resend OTP
router.post('/users/resend-otp', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.resendOTP(email);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json({ success: false, message: result.message });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/login  -> regular user auth (login by username or email)
router.post('/users/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = username or email
    const id = identifier || req.body.username || req.body.email;
    const result = await authService.authenticateUser(id, password);
    if (result.success) return res.json({ success: true, token: result.token, user: result.user });
    return res.status(401).json({ success: false, message: result.message });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// keep admin login route
router.post('/admin/login', async (req, res) => {
  try {
    const { identifier, password } = req.body; // identifier = username or email
    const id = identifier || req.body.username || req.body.email;
    const result = await authService.authenticateUser(id, password);
    if (result.success) return res.json({ success: true, token: result.token, admin: result.user });
    return res.status(401).json({ success: false, message: result.message });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;