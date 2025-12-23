# Orders API Documentation

## Overview
Complete order management system with product reference, customer information, payment tracking, and order status management.

---

## API Endpoints

### 1. Create Order
**POST** `/api/orders`

Create a new order with customer information and items.

**Request Body:**
```json
{
  "formData": {
    "fullName": "John Doe",
    "email": "john@example.com",
    "phone": "+1234567890",
    "address": "123 Main St",
    "city": "New York",
    "state": "NY",
    "zipCode": "10001",
    "country": "USA"
  },
  "items": [
    {
      "_id": "6947d156ab1ece4a5bdcbd43",
      "name": "Kamagra 100 mg tablet",
      "price": 300,
      "quantity": 2,
      "unitType": "strip",
      "selectedQuantity": 25,
      "discount": 20
    }
  ],
  "total": 660,
  "userId": "optional-user-id",
  "paymentMethod": "cash_on_delivery"
}
```

**Item Fields Explanation:**
- `_id` - Product ID from database
- `name` - Product name
- `price` - Base price per unit (before discount)
- `quantity` - Number of units to order (e.g., 2 strips)
- `unitType` - Type of unit: "strip" or "pack"
- `selectedQuantity` - Variant: items per unit (e.g., 25 tablets per strip)
- `discount` - Variant discount percentage (0-100)

**Calculation Example:**
- Base price: ₹300 per strip
- Variant discount: 20%
- Price after discount: ₹300 - (₹300 × 20%) = ₹240
- Quantity: 2 strips
- Subtotal: ₹240 × 2 = ₹480
- Total items: 2 strips × 25 tablets = 50 tablets

**Response (201):**
```json
{
  "success": true,
  "message": "Order created successfully",
  "orderNumber": "ORD-2025-000001",
  "order": {
    "_id": "...",
    "orderNumber": "ORD-2025-000001",
    "customerInfo": {...},
    "items": [...],
    "total": 660,
    "status": "pending",
    "createdAt": "2025-12-23T..."
  }
}
```

---

### 2. Get All Orders
**GET** `/api/orders`

Get all orders with optional filters.

**Query Parameters:**
- `status` - Filter by status (pending, processing, shipped, delivered, cancelled)
- `userId` - Filter by user ID
- `limit` - Number of orders per page (default: 50)
- `skip` - Number of orders to skip for pagination
- `sortBy` - Sort field (default: createdAt)
- `sortOrder` - Sort order: 1 (asc) or -1 (desc)

**Example:**
```
GET /api/orders?status=pending&limit=10&skip=0
```

**Response (200):**
```json
{
  "success": true,
  "orders": [...],
  "total": 100,
  "page": 1,
  "totalPages": 10
}
```

---

### 3. Get Order Statistics
**GET** `/api/orders/stats`

Get order statistics and analytics.

**Query Parameters:**
- `startDate` - Filter from date (ISO format)
- `endDate` - Filter to date (ISO format)
- `userId` - Filter by user ID

**Response (200):**
```json
{
  "success": true,
  "stats": {
    "totalOrders": 150,
    "totalRevenue": 45000,
    "averageOrderValue": 300,
    "pendingOrders": 10,
    "processingOrders": 5,
    "shippedOrders": 20,
    "deliveredOrders": 100,
    "cancelledOrders": 15
  }
}
```

---

### 4. Get User Orders
**GET** `/api/orders/user/:userId`

Get all orders for a specific user.

**Query Parameters:**
- `status` - Filter by status
- `limit` - Number of orders per page (default: 20)
- `skip` - Number of orders to skip

**Example:**
```
GET /api/orders/user/65abc123.../status=delivered
```

**Response (200):**
```json
{
  "success": true,
  "orders": [...],
  "total": 15,
  "page": 1,
  "totalPages": 2
}
```

---

### 5. Get Order by Order Number
**GET** `/api/orders/number/:orderNumber`

Get order details by order number.

**Example:**
```
GET /api/orders/number/ORD-2025-000001
```

**Response (200):**
```json
{
  "success": true,
  "order": {
    "_id": "...",
    "orderNumber": "ORD-2025-000001",
    "customerInfo": {...},
    "items": [...],
    "status": "delivered",
    "total": 660
  }
}
```

---

### 6. Get Order by ID
**GET** `/api/orders/:id`

Get order details by MongoDB ID.

**Example:**
```
GET /api/orders/6947d156ab1ece4a5bdcbd43
```

---

### 7. Update Order Status
**PATCH** `/api/orders/:id/status`

Update order status with optional tracking information.

**Request Body:**
```json
{
  "status": "shipped",
  "tracking": {
    "carrier": "DHL",
    "trackingNumber": "DHL123456789"
  },
  "notes": "Package shipped via express delivery"
}
```

**Valid Status Values:**
- `pending` - Order received, awaiting processing
- `processing` - Order being prepared
- `shipped` - Order shipped to customer
- `delivered` - Order delivered successfully
- `cancelled` - Order cancelled

**For Cancelled Orders:**
```json
{
  "status": "cancelled",
  "cancelReason": "Customer requested cancellation"
}
```

**Response (200):**
```json
{
  "success": true,
  "message": "Order status updated to shipped",
  "order": {...}
}
```

---

### 8. Update Payment Status
**PATCH** `/api/orders/:id/payment`

Update payment status for an order.

**Request Body:**
```json
{
  "status": "completed",
  "transactionId": "TXN123456789"
}
```

**Valid Payment Status:**
- `pending` - Payment not yet received
- `completed` - Payment successful
- `failed` - Payment failed
- `refunded` - Payment refunded

**Response (200):**
```json
{
  "success": true,
  "message": "Payment status updated",
  "order": {...}
}
```

---

### 9. Delete Order
**DELETE** `/api/orders/:id`

Delete an order (admin only). Automatically restores product stock.

**Response (200):**
```json
{
  "success": true,
  "message": "Order deleted successfully"
}
```

---

## Order Schema

```javascript
{
  orderNumber: "ORD-2025-000001",  // Auto-generated
  user: ObjectId,                   // Optional user reference
  
  customerInfo: {
    fullName: String,
    email: String,
    phone: String,
    address: String,
    city: String,
    state: String,
    zipCode: String,
    country: String
  },
  
  items: [{
    product: ObjectId,              // Product reference
    name: String,
    price: Number,                  // Base price per unit
    quantity: Number,               // Number of units (strips/packs)
    unitType: "strip" | "pack",
    variant: {
      quantityPerUnit: Number,      // Items per unit (e.g., 25 tablets per strip)
      discount: Number              // Variant discount percentage
    },
    totalItems: Number,             // quantity × quantityPerUnit
    finalPrice: Number,             // Price after discount
    subtotal: Number                // finalPrice × quantity
  }],
  
  shippingAddress: {
    name: String,
    street: String,
    city: String,
    state: String,
    zipCode: String,
    country: String,
    phone: String
  },
  
  billingAddress: { ... },          // Optional
  
  payment: {
    method: "cash_on_delivery" | "credit_card" | "debit_card" | "paypal" | "stripe",
    status: "pending" | "completed" | "failed" | "refunded",
    transactionId: String,
    paidAt: Date
  },
  
  subtotal: Number,
  tax: Number,
  shippingCost: Number,
  discount: Number,
  total: Number,
  
  status: "pending" | "processing" | "shipped" | "delivered" | "cancelled",
  
  tracking: {
    carrier: String,
    trackingNumber: String,
    shippedAt: Date,
    deliveredAt: Date
  },
  
  notes: String,
  cancelledAt: Date,
  cancelReason: String,
  
  createdAt: Date,
  updatedAt: Date
}
```

---

## Features

### Automatic Order Number Generation
Orders are automatically assigned unique order numbers in format: `ORD-YYYY-NNNNNN`
- Example: `ORD-2025-000001`

### Stock Management
- Stock is automatically reduced when order is created
- Stock is automatically restored when order is cancelled or deleted
- Sales count is updated for products

### Order Status Workflow
```
pending → processing → shipped → delivered
   ↓
cancelled (at any stage)
```

### Payment Integration Ready
- Multiple payment methods supported
- Transaction tracking
- Payment status management

---

## Usage Examples

### Create Order from Cart
```javascript
const orderData = {
  formData: {
    fullName: "John Doe",
    email: "john@example.com",
    phone: "+1234567890",
    address: "123 Main St",
    city: "New York",
    state: "NY",
    zipCode: "10001",
    country: "USA"
  },
  items: cartItems.map(item => ({
    _id: item._id,
    name: item.name,
    price: item.price,
    quantity: item.quantity,
    unitType: item.unitType,
    selectedQuantity: item.selectedQuantity,
    discount: item.discount || 0
  })),
  total: calculateTotal(cartItems),
  userId: currentUser?.id,
  paymentMethod: "cash_on_delivery"
};

const response = await fetch('/api/orders', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(orderData)
});
```

### Track Order
```javascript
const response = await fetch(`/api/orders/number/${orderNumber}`);
const { order } = await response.json();

console.log(`Order Status: ${order.status}`);
console.log(`Tracking: ${order.tracking?.trackingNumber}`);
```

### Get User Orders
```javascript
const response = await fetch(`/api/orders/user/${userId}?status=delivered`);
const { orders } = await response.json();
```

### Update Order Status (Admin)
```javascript
const response = await fetch(`/api/orders/${orderId}/status`, {
  method: 'PATCH',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    status: 'shipped',
    tracking: {
      carrier: 'DHL',
      trackingNumber: 'DHL123456789'
    }
  })
});
```

---

## Error Handling

All endpoints return consistent error format:

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

Common errors:
- `400` - Bad request (invalid data)
- `404` - Order not found
- `500` - Server error

---

## Notes

- Orders can be created with or without user authentication
- Guest checkout is supported (no userId required)
- Product stock is validated before order creation
- Cancelled orders automatically restore product stock
- Order statistics can be filtered by date range
- All timestamps are in ISO 8601 format

---

## Testing

Use the provided Postman collection or test with curl:

```bash
# Create order
curl -X POST http://localhost:5000/api/orders \
  -H "Content-Type: application/json" \
  -d @order-data.json

# Get orders
curl http://localhost:5000/api/orders?status=pending

# Update status
curl -X PATCH http://localhost:5000/api/orders/{id}/status \
  -H "Content-Type: application/json" \
  -d '{"status":"shipped","tracking":{"carrier":"DHL","trackingNumber":"123"}}'
```
