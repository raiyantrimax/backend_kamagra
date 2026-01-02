const express = require('express');
const router = express.Router();

const authService = require('../services/auth.service');
const usersService = require('../services/users.service');
const { authenticateUser, requireRole } = require('../middleware/auth');

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

// POST /api/users/forgot-password  -> request password reset OTP
router.post('/users/forgot-password', async (req, res) => {
  try {
    const { email } = req.body;
    const result = await authService.forgotPassword(email);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json({ success: false, message: result.message });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// POST /api/users/reset-password  -> reset password with OTP
router.post('/users/reset-password', async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    const result = await authService.resetPasswordWithOTP(email, otp, newPassword);
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

// GET /api/users - Get all users (Admin only)
router.get('/users', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { role, isActive, limit, skip, sortBy, sortOrder, search } = req.query;
    const result = await usersService.getAllUsers({
      role,
      isActive,
      limit,
      skip,
      sortBy,
      sortOrder: sortOrder ? parseInt(sortOrder) : -1,
      search
    });
    
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// GET /api/users/stats - Get user statistics (Admin only)
router.get('/users/stats', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const result = await usersService.getUserStats();
    
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// POST /api/users/:id/change-password -> change password (user can only change their own)
router.post('/users/:id/change-password', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const { currentPassword, newPassword } = req.body;
    
    // Users can only change their own password unless they're admin
    if (req.user.id !== id && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only change your own password' 
      });
    }
    
    const result = await authService.changePassword(id, currentPassword, newPassword);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json({ success: false, message: result.message });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

// GET /api/users/:id - Get user by ID (Admin or own profile)
router.get('/users/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    // Users can only view their own profile unless they're admin
    if (req.user.id !== id && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only view your own profile' 
      });
    }
    
    const result = await usersService.getUserById(id);
    
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(404).json(result);
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// PUT /api/users/:id - Update user (Admin or own profile)
router.put('/users/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    const result = await usersService.updateUser(
      req.user.id, 
      updateData, 
      req.user.id, 
      req.user.role
    );
    
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// DELETE /api/users/:id - Delete user (Admin only)
router.delete('/users/:id', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await usersService.deleteUser(id, req.user.role);
    
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});

// PATCH /api/users/:id/toggle-status - Toggle user active status (Admin only)
router.patch('/users/:id/toggle-status', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await usersService.toggleUserStatus(id, req.user.role);
    
    if (result.success) {
      return res.status(200).json(result);
    }
    return res.status(400).json(result);
  } catch (error) {
    return res.status(500).json({ 
      success: false, 
      message: 'Server error', 
      error: error.message 
    });
  }
});


// POST /api/users/change-password -> change password (user only)
router.post('/users/:id/change-password', authenticateUser, requireRole('user'), async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    console.log('Change password request for user:', req.user.id);
    const result = await authService.changePassword(req.user.id, currentPassword, newPassword);
    if (result.success) return res.status(200).json(result);
    return res.status(400).json({ success: false, message: result.message });
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }
});

module.exports = router;