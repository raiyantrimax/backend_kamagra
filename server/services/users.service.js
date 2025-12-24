const User = require('../model/Users.model');
const bcrypt = require('bcrypt');

// Get all users (Admin only)
async function getAllUsers(filters = {}) {
  try {
    const { role, isActive, limit = 50, skip = 0, sortBy = 'createdAt', sortOrder = -1, search } = filters;
    
    const query = {};
    if (role) query.role = role;
    if (isActive !== undefined) query.isActive = isActive === 'true';
    
    // Search by name or email
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } }
      ];
    }

    const users = await User.find(query)
      .select('-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires')
      .sort({ [sortBy]: sortOrder })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await User.countDocuments(query);

    return {
      success: true,
      users,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Get users error:', error);
    return { success: false, message: 'Failed to fetch users', error: error.message };
  }
}

// Get user by ID
async function getUserById(userId) {
  try {
    const user = await User.findById(userId)
      .select('-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires');

    if (!user) {
      return { success: false, message: 'User not found' };
    }

    return { success: true, user };
  } catch (error) {
    console.error('Get user error:', error);
    return { success: false, message: 'Failed to fetch user', error: error.message };
  }
}

// Update user profile
async function updateUser(userId, updateData, requestingUserId, requestingUserRole) {
  try {
    // Check if user can update this profile
    const isOwnProfile = userId === requestingUserId;
    const isAdmin = ['admin', 'super_admin'].includes(requestingUserRole);

    if (!isOwnProfile && !isAdmin) {
      return { success: false, message: 'You can only update your own profile' };
    }

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Fields that can be updated by the user themselves
    const userEditableFields = ['name', 'phone', 'address'];
    
    // Fields that only admins can update
    const adminOnlyFields = ['role', 'isActive', 'isEmailVerified'];

    // Update fields
    if (isOwnProfile && !isAdmin) {
      // Regular users can only update their own basic info
      userEditableFields.forEach(field => {
        if (updateData[field] !== undefined) {
          if (field === 'address' && typeof updateData[field] === 'object') {
            user.address = { ...user.address, ...updateData[field] };
          } else {
            user[field] = updateData[field];
          }
        }
      });
    } else if (isAdmin) {
      // Admins can update everything except password
      [...userEditableFields, ...adminOnlyFields].forEach(field => {
        if (updateData[field] !== undefined) {
          if (field === 'address' && typeof updateData[field] === 'object') {
            user.address = { ...user.address, ...updateData[field] };
          } else {
            user[field] = updateData[field];
          }
        }
      });
    }

    // Handle password update separately
    if (updateData.password) {
      if (isOwnProfile || isAdmin) {
        // If user is updating their own password, verify current password
        if (isOwnProfile && updateData.currentPassword) {
          const isMatch = await user.comparePassword(updateData.currentPassword);
          if (!isMatch) {
            return { success: false, message: 'Current password is incorrect' };
          }
        }
        user.password = updateData.password;
      }
    }

    await user.save();

    // Return user without sensitive info
    const updatedUser = await User.findById(userId)
      .select('-password -otp -otpExpires -resetPasswordToken -resetPasswordExpires');

    return { 
      success: true, 
      message: 'User updated successfully', 
      user: updatedUser 
    };
  } catch (error) {
    console.error('Update user error:', error);
    return { success: false, message: 'Failed to update user', error: error.message };
  }
}

// Delete user (Admin only)
async function deleteUser(userId, requestingUserRole) {
  try {
    if (!['admin', 'super_admin'].includes(requestingUserRole)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Prevent deleting super_admin
    if (user.role === 'super_admin') {
      return { success: false, message: 'Cannot delete super admin' };
    }

    await User.findByIdAndDelete(userId);

    return { success: true, message: 'User deleted successfully' };
  } catch (error) {
    console.error('Delete user error:', error);
    return { success: false, message: 'Failed to delete user', error: error.message };
  }
}

// Get user statistics (Admin only)
async function getUserStats() {
  try {
    const totalUsers = await User.countDocuments();
    const activeUsers = await User.countDocuments({ isActive: true });
    const verifiedUsers = await User.countDocuments({ isEmailVerified: true });
    
    const usersByRole = await User.aggregate([
      {
        $group: {
          _id: '$role',
          count: { $sum: 1 }
        }
      }
    ]);

    const recentUsers = await User.find()
      .select('name email role createdAt')
      .sort({ createdAt: -1 })
      .limit(10);

    return {
      success: true,
      stats: {
        total: totalUsers,
        active: activeUsers,
        verified: verifiedUsers,
        byRole: usersByRole,
        recent: recentUsers
      }
    };
  } catch (error) {
    console.error('Get user stats error:', error);
    return { success: false, message: 'Failed to fetch user statistics', error: error.message };
  }
}

// Toggle user active status (Admin only)
async function toggleUserStatus(userId, requestingUserRole) {
  try {
    if (!['admin', 'super_admin'].includes(requestingUserRole)) {
      return { success: false, message: 'Insufficient permissions' };
    }

    const user = await User.findById(userId);
    if (!user) {
      return { success: false, message: 'User not found' };
    }

    // Prevent deactivating super_admin
    if (user.role === 'super_admin') {
      return { success: false, message: 'Cannot deactivate super admin' };
    }

    user.isActive = !user.isActive;
    await user.save();

    return { 
      success: true, 
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      isActive: user.isActive
    };
  } catch (error) {
    console.error('Toggle user status error:', error);
    return { success: false, message: 'Failed to update user status', error: error.message };
  }
}

module.exports = {
  getAllUsers,
  getUserById,
  updateUser,
  deleteUser,
  getUserStats,
  toggleUserStatus
};
