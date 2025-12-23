const express = require('express');
const router = express.Router();
const ordersService = require('../services/orders.service');
const { authenticateUser, optionalAuth, requireRole } = require('../middleware/auth');

// POST /api/orders - Create new order (authenticated users)
router.post('/', authenticateUser, async (req, res) => {
  try {
    const orderData = req.body;
    
    // Get userId from authenticated user
    const userId = req.user.id;
    
    const result = await ordersService.createOrder({
      ...orderData,
      userId: userId
    });
    
    if (result.success) {
      return res.status(201).json(result);
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

// GET /api/orders - Get all orders (with filters) - Admin only
router.get('/', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { status, userId, limit, skip, sortBy, sortOrder } = req.query;
    
    const result = await ordersService.getAllOrders({
      status,
      userId,
      limit,
      skip,
      sortBy,
      sortOrder: sortOrder ? parseInt(sortOrder) : -1
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

// GET /api/orders/stats - Get order statistics - Admin only
router.get('/stats', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { startDate, endDate, userId } = req.query;
    
    const result = await ordersService.getOrderStats({
      startDate,
      endDate,
      userId
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

// GET /api/orders/user/:userId - Get orders by user - Admin or own orders
router.get('/user/:userId', authenticateUser, async (req, res) => {
  try {
    const { userId } = req.params;
    const { status, limit, skip } = req.query;
    
    // Users can only view their own orders unless they're admin
    if (req.user.id !== userId && !['admin', 'super_admin'].includes(req.user.role)) {
      return res.status(403).json({ 
        success: false, 
        message: 'You can only view your own orders' 
      });
    }
    
    const result = await ordersService.getUserOrders(userId, {
      status,
      limit,
      skip
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

// GET /api/orders/my-orders - Get current user's orders
router.get('/my-orders', authenticateUser, async (req, res) => {
  try {
    const { status, limit, skip } = req.query;
    
    const result = await ordersService.getUserOrders(req.user.id, {
      status,
      limit,
      skip
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

// GET /api/orders/:id - Get order by ID - Admin or order owner
router.get('/:id', authenticateUser, async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await ordersService.getOrderByNumber(id);
    
    if (result.success) {
      // Check if user has permission to view this order
      const order = result.order;
      const isOwner = order.user && order.user._id.toString() === req.user.id;
      const isAdmin = ['admin', 'super_admin'].includes(req.user.role);
      
      if (!isOwner && !isAdmin) {
        return res.status(403).json({ 
          success: false, 
          message: 'You do not have permission to view this order' 
        });
      }
      
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

// PATCH /api/orders/:id/status - Update order status - Admin only
router.patch('/:id/status', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, tracking, cancelReason, notes } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Status is required' 
      });
    }
    
    const result = await ordersService.updateOrderStatus(id, status, {
      tracking,
      cancelReason,
      notes
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

// PATCH /api/orders/:id/payment - Update payment status - Admin only
router.patch('/:id/payment', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    const { status, transactionId } = req.body;
    
    if (!status) {
      return res.status(400).json({ 
        success: false, 
        message: 'Payment status is required' 
      });
    }
    
    const result = await ordersService.updatePaymentStatus(id, {
      status,
      transactionId
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

// DELETE /api/orders/:id - Delete order - Admin only
router.delete('/:id', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { id } = req.params;
    
    const result = await ordersService.deleteOrder(id);
    
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

module.exports = router;
