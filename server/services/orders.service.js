const Order = require('../model/Orders.model');
const Product = require('../model/Products');
const User = require('../model/Users.model');

// Create new order
async function createOrder(orderData) {
  try {
    const { formData, items, total, userId } = orderData;

    // Validate required fields
    if (!formData || !items || items.length === 0) {
      return { success: false, message: 'Order data is incomplete' };
    }

    // Calculate subtotal from items
    let calculatedSubtotal = 0;
    const orderItems = [];

    for (const item of items) {
      // Verify product exists
      const product = await Product.findById(item._id);
      if (!product) {
        return { success: false, message: `Product ${item.name} not found` };
      }

      // Validate variant if product has variants and selectedQuantity > 1
      if (product.variants && product.variants.length > 0 && item.selectedQuantity > 1) {
        const variant = product.variants.find(v => 
          v.quantity === item.selectedQuantity && v.discount === item.discount
        );
        
        if (!variant) {
          return { 
            success: false, 
            message: `Invalid variant for ${item.name}. Available variants: ${product.variants.map(v => `${v.quantity} units (${v.discount}% off)`).join(', ')}. Single unit orders are always allowed.` 
          };
        }
      }

      // Check stock availability
      if (product.stock < item.quantity) {
        return { 
          success: false, 
          message: `Insufficient stock for ${item.name}. Available: ${product.stock}, Requested: ${item.quantity}` 
        };
      }

      // Calculate pricing with variant discount
      const itemPrice = item.price;
      const variantDiscount = item.discount || 0;
      const discountAmount = (itemPrice * variantDiscount) / 100;
      const finalPrice = itemPrice - discountAmount;
      
      // Calculate total: quantity of units * price per unit after discount
      const subtotal = finalPrice * item.quantity;
      
      // Total items: quantity of units * items per unit (e.g., 2 strips * 1 = 2 strips OR 1 pack * 3 strips = 3 strips)
      const totalItems = item.quantity * (item.selectedQuantity || 1);
      
      calculatedSubtotal += subtotal;

      orderItems.push({
        product: item._id,
        name: item.name,
        price: item.price,
        quantity: item.quantity,
        unitType: item.unitType || 'strip',
        variant: {
          quantity: item.selectedQuantity,
          discount: item.discount || 0
        },
        totalItems: totalItems,
        finalPrice: finalPrice,
        subtotal: subtotal
      });
    }

    // Create order object
    const order = new Order({
      user: userId || null,
      customerInfo: {
        fullName: formData.fullName,
        email: formData.email,
        phone: formData.phone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country
      },
      items: orderItems,
      subtotal: calculatedSubtotal,
      total: total || calculatedSubtotal,
      shippingAddress: {
        name: formData.fullName,
        street: formData.address,
        city: formData.city,
        state: formData.state,
        zipCode: formData.zipCode,
        country: formData.country,
        phone: formData.phone
      },
      payment: {
        method: orderData.paymentMethod || 'cash_on_delivery',
        status: 'pending'
      }
    });

    await order.save();

    // Update product stock based on variant quantity
    for (const item of items) {
      // Calculate total items: quantity * variant quantity
      // e.g., 2 packs * 25 strips per pack = 50 strips total
      const totalItemsOrdered = item.quantity * (item.selectedQuantity || 1);
      
      await Product.findByIdAndUpdate(
        item._id,
        { 
          $inc: { stock: -totalItemsOrdered, sales: totalItemsOrdered }
        }
      );
    }

    return { 
      success: true, 
      message: 'Order created successfully',
      order: order,
      orderId: order._id
    };
  } catch (error) {
    console.error('Create order error:', error);
    return { 
      success: false, 
      message: 'Failed to create order', 
      error: error.message 
    };
  }
}

// Get all orders
async function getAllOrders(filters = {}) {
  try {
    const { status, userId, limit = 50, skip = 0, sortBy = 'createdAt', sortOrder = -1 } = filters;
    
    const query = {};
    if (status) query.status = status;
    if (userId) query.user = userId;

    const orders = await Order.find(query)
      .populate('user', 'name email')
      .populate('items.product', 'name image category')
      .sort({ [sortBy]: sortOrder })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Order.countDocuments(query);

    return {
      success: true,
      orders,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Get orders error:', error);
    return { success: false, message: 'Failed to fetch orders', error: error.message };
  }
}

// Get order by ID
async function getOrderById(orderId) {
  try {
    const order = await Order.findById(orderId)
      .populate('user', 'name email phone')
      .populate('items.product', 'name image category price stock');

    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    return { success: true, order };
  } catch (error) {
    console.error('Get order error:', error);
    return { success: false, message: 'Failed to fetch order', error: error.message };
  }
}

// Get order by order ID (supports both _id and older orderNumber if needed)
async function getOrderByNumber(orderIdOrNumber) {
  try {
    let order;
    
    // Try to find by _id first
    if (orderIdOrNumber.match(/^[0-9a-fA-F]{24}$/)) {
      order = await Order.findById(orderIdOrNumber)
        .populate('user', 'name email phone')
        .populate('items.product', 'name image category price');
    }
    
    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    return { success: true, order };
  } catch (error) {
    console.error('Get order error:', error);
    return { success: false, message: 'Failed to fetch order', error: error.message };
  }
}

// Get user orders
async function getUserOrders(userId, filters = {}) {
  try {
    const { status, limit = 20, skip = 0 } = filters;
    
    const query = { user: userId };
    if (status) query.status = status;

    const orders = await Order.find(query)
      .populate('items.product', 'name image category')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Order.countDocuments(query);

    return {
      success: true,
      orders,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Get user orders error:', error);
    return { success: false, message: 'Failed to fetch orders', error: error.message };
  }
}

// Update order status
async function updateOrderStatus(orderId, status, additionalData = {}) {
  try {
    const validStatuses = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];
    if (!validStatuses.includes(status)) {
      return { success: false, message: 'Invalid order status' };
    }

    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    order.status = status;

    // Handle status-specific updates
    if (status === 'shipped' && additionalData.tracking) {
      order.tracking = {
        carrier: additionalData.tracking.carrier,
        trackingNumber: additionalData.tracking.trackingNumber,
        shippedAt: new Date()
      };
    }

    if (status === 'delivered') {
      order.tracking = order.tracking || {};
      order.tracking.deliveredAt = new Date();
      order.payment.status = 'completed';
    }

    if (status === 'cancelled') {
      order.cancelledAt = new Date();
      order.cancelReason = additionalData.cancelReason || 'Cancelled by user';
      
      // Restore product stock
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { 
            $inc: { stock: item.quantity, sales: -item.quantity }
          }
        );
      }
    }

    if (additionalData.notes) {
      order.notes = additionalData.notes;
    }

    await order.save();

    return { 
      success: true, 
      message: `Order status updated to ${status}`,
      order 
    };
  } catch (error) {
    console.error('Update order status error:', error);
    return { success: false, message: 'Failed to update order status', error: error.message };
  }
}

// Update payment status
async function updatePaymentStatus(orderId, paymentData) {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    order.payment.status = paymentData.status;
    if (paymentData.transactionId) {
      order.payment.transactionId = paymentData.transactionId;
    }
    if (paymentData.status === 'completed') {
      order.payment.paidAt = new Date();
    }

    await order.save();

    return { 
      success: true, 
      message: 'Payment status updated',
      order 
    };
  } catch (error) {
    console.error('Update payment error:', error);
    return { success: false, message: 'Failed to update payment', error: error.message };
  }
}

// Delete order (admin only)
async function deleteOrder(orderId) {
  try {
    const order = await Order.findById(orderId);
    if (!order) {
      return { success: false, message: 'Order not found' };
    }

    // Restore stock if order was not cancelled
    if (order.status !== 'cancelled') {
      for (const item of order.items) {
        await Product.findByIdAndUpdate(
          item.product,
          { 
            $inc: { stock: item.quantity, sales: -item.quantity }
          }
        );
      }
    }

    await Order.findByIdAndDelete(orderId);

    return { success: true, message: 'Order deleted successfully' };
  } catch (error) {
    console.error('Delete order error:', error);
    return { success: false, message: 'Failed to delete order', error: error.message };
  }
}

// Get order statistics
async function getOrderStats(filters = {}) {
  try {
    const { startDate, endDate, userId } = filters;
    
    const query = {};
    if (startDate || endDate) {
      query.createdAt = {};
      if (startDate) query.createdAt.$gte = new Date(startDate);
      if (endDate) query.createdAt.$lte = new Date(endDate);
    }
    if (userId) query.user = userId;

    const stats = await Order.aggregate([
      { $match: query },
      {
        $group: {
          _id: null,
          totalOrders: { $sum: 1 },
          totalRevenue: { $sum: '$total' },
          averageOrderValue: { $avg: '$total' },
          pendingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
          },
          processingOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'processing'] }, 1, 0] }
          },
          shippedOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'shipped'] }, 1, 0] }
          },
          deliveredOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'delivered'] }, 1, 0] }
          },
          cancelledOrders: {
            $sum: { $cond: [{ $eq: ['$status', 'cancelled'] }, 1, 0] }
          }
        }
      }
    ]);

    return {
      success: true,
      stats: stats[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        pendingOrders: 0,
        processingOrders: 0,
        shippedOrders: 0,
        deliveredOrders: 0,
        cancelledOrders: 0
      }
    };
  } catch (error) {
    console.error('Get order stats error:', error);
    return { success: false, message: 'Failed to fetch statistics', error: error.message };
  }
}

module.exports = {
  createOrder,
  getAllOrders,
  getOrderById,
  getOrderByNumber,
  getUserOrders,
  updateOrderStatus,
  updatePaymentStatus,
  deleteOrder,
  getOrderStats
};
