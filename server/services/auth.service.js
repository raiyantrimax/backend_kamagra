const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const User = require('../model/Users.model');
const { generateOTP, sendOTPEmail, sendWelcomeEmail, sendPasswordResetOTP } = require('./email.service');

const JWT_SECRET = process.env.JWT_SECRET || 'dev-secret';
const TOKEN_EXPIRES_IN = '8h';
const OTP_EXPIRES_IN = 10 * 60 * 1000; // 10 minutes in milliseconds
const OTP_RESEND_WAIT_TIME = 10 * 60 * 1000; // 10 minutes wait before resending

function signToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: TOKEN_EXPIRES_IN });
}

function sanitizeUser(user) {
  if (!user) return null;
  const { password, __v, otp, otpExpires, otpLastSentAt, resetPasswordToken, resetPasswordExpires, ...rest } = user.toObject ? user.toObject() : user;
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
    otpLastSentAt: new Date(),
    isEmailVerified: false
  });
  await user.save();

  // Send OTP email asynchronously (don't wait for it to complete)
  sendOTPEmail(email, otp, username).catch(err => {
    console.error('Failed to send OTP email:', err);
  });

  return { 
    success: true, 
    message: 'Registration successful! Please check your email for OTP verification.',
    user: sanitizeUser(user)
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

  // Update last login without triggering full validation
  await User.findByIdAndUpdate(user._id, { lastLogin: new Date() }, { runValidators: false });

  const token = signToken({ id: user._id, name: user.name, role: user.role });
  return { success: true, token, user: sanitizeUser(user) };
}

async function authenticateAdmin(username, password) {
  if (!username || !password) return { success: false, message: 'Missing credentials' };

  const admin = await User.findOne({ name: username, role: 'admin' });
  if (!admin) return { success: false, message: 'Admin not found' };

  const match = await admin.comparePassword(password);
  if (!match) return { success: false, message: 'Invalid credentials' };

  // Update last login without triggering full validation
  await User.findByIdAndUpdate(admin._id, { lastLogin: new Date() }, { runValidators: false });

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

  // Send welcome email asynchronously (don't wait for it to complete)
  sendWelcomeEmail(user.email, user.name).catch(err => {
    console.error('Failed to send welcome email:', err);
  });

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

  // Check if 10 minutes have passed since last OTP was sent
  if (user.otpLastSentAt) {
    const timeSinceLastOTP = Date.now() - user.otpLastSentAt.getTime();
    if (timeSinceLastOTP < OTP_RESEND_WAIT_TIME) {
      const waitTimeRemaining = Math.ceil((OTP_RESEND_WAIT_TIME - timeSinceLastOTP) / 1000 / 60);
      return { 
        success: false, 
        message: `Please wait ${waitTimeRemaining} minute(s) before requesting a new OTP`
      };
    }
  }

  // Generate new OTP
  const otp = generateOTP();
  const otpExpires = new Date(Date.now() + OTP_EXPIRES_IN);

  user.otp = otp;
  user.otpExpires = otpExpires;
  user.otpLastSentAt = new Date();
  await user.save();

  // Send OTP email asynchronously (don't wait for it to complete)
  sendOTPEmail(email, otp, user.name).catch(err => {
    console.error('Failed to send OTP email:', err);
  });

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

async function changePassword(userId, currentPassword, newPassword) {
  try {
    console.log('Change password request for userId:', userId);
    
    if (!currentPassword || !newPassword) {
      return { success: false, message: 'Current password and new password are required' };
    }

    if (newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long' };
    }

    if (currentPassword === newPassword) {
      return { success: false, message: 'New password must be different from current password' };
    }

    const user = await User.findById(userId);
    if (!user) {
      console.log('User not found for userId:', userId);
      return { success: false, message: 'User not found' };
    }

    console.log('User found:', user.email);

    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    console.log('Password match result:', isMatch);
    
    if (!isMatch) {
      return { success: false, message: 'Current password is incorrect' };
    }

    // Update password - explicitly mark as modified
    user.password = newPassword;
    user.markModified('password');
    await user.save();

    console.log('Password changed successfully for user:', user.email);

    return {
      success: true,
      message: 'Password changed successfully'
    };
  } catch (error) {
    console.error('Change password error:', error);
    return { success: false, message: 'Failed to change password', error: error.message };
  }
}

async function forgotPassword(email) {
  try {
    if (!email) {
      return { success: false, message: 'Email is required' };
    }

    const user = await User.findOne({ email });
    if (!user) {
      // Return success even if user not found for security (don't reveal user existence)
      return { 
        success: true, 
        message: 'If an account with that email exists, a password reset OTP has been sent.'
      };
    }

    // Check if OTP was recently sent (within 10 minutes)
    if (user.otpLastSentAt) {
      const timeSinceLastOTP = Date.now() - user.otpLastSentAt.getTime();
      if (timeSinceLastOTP < OTP_RESEND_WAIT_TIME) {
        const waitTimeRemaining = Math.ceil((OTP_RESEND_WAIT_TIME - timeSinceLastOTP) / 1000 / 60);
        return { 
          success: false, 
          message: `Please wait ${waitTimeRemaining} minute(s) before requesting a new OTP. An OTP was recently sent to your email.`
        };
      }
    }

    // Generate new OTP for password reset
    const otp = generateOTP();
    const otpExpires = new Date(Date.now() + OTP_EXPIRES_IN);

    // Store OTP in user document
    user.otp = otp;
    user.otpExpires = otpExpires;
    user.otpLastSentAt = new Date();
    await user.save();

    // Send password reset OTP email
    const emailResult = await sendPasswordResetOTP(email, otp, user.name);
    
    if (!emailResult.success) {
      console.error('Failed to send password reset email:', emailResult.error);
    }

    return { 
      success: true, 
      message: 'If an account with that email exists, a password reset OTP has been sent. The OTP will expire in 10 minutes.'
    };
  } catch (error) {
    console.error('Forgot password error:', error);
    return { success: false, message: 'Failed to process password reset request', error: error.message };
  }
}

async function resetPasswordWithOTP(email, otp, newPassword) {
  try {
    if (!email || !otp || !newPassword) {
      return { success: false, message: 'Email, OTP, and new password are required' };
    }

    if (newPassword.length < 6) {
      return { success: false, message: 'New password must be at least 6 characters long' };
    }

    const user = await User.findOne({ email });
    if (!user) {
      return { success: false, message: 'Invalid email or OTP' };
    }

    // Check if OTP exists
    if (!user.otp || !user.otpExpires) {
      return { success: false, message: 'No password reset request found. Please request a new OTP.' };
    }

    // Check if OTP has expired
    if (new Date() > user.otpExpires) {
      return { success: false, message: 'OTP has expired. Please request a new one.' };
    }

    // Verify OTP
    if (user.otp !== otp) {
      return { success: false, message: 'Invalid OTP' };
    }

    // Update password and clear OTP fields
    user.password = newPassword;
    user.otp = undefined;
    user.otpExpires = undefined;
    user.otpLastSentAt = undefined;
    user.markModified('password');
    await user.save();

    console.log('Password reset successfully for user:', user.email);

    return {
      success: true,
      message: 'Password has been reset successfully. You can now login with your new password.'
    };
  } catch (error) {
    console.error('Reset password error:', error);
    return { success: false, message: 'Failed to reset password', error: error.message };
  }
}

module.exports = {
  registerUser,
  authenticateUser,
  authenticateAdmin,
  verifyToken,
  verifyOTP,
  resendOTP,
  changePassword,
  forgotPassword,
  resetPasswordWithOTP
};