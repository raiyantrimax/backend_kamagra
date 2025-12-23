# Product Variants in Order System

## Understanding Product Variants

### What are Variants?
Variants are different quantity options for a product with associated discounts. For example, a medicine might offer:
- 10 tablets at regular price (0% discount)
- 25 tablets at 20% discount
- 50 tablets at 30% discount

This encourages bulk purchases while providing flexible options to customers.

---

## How Variants Work in Orders

### Product Setup (Example)
```javascript
// Product: Kamagra 100 mg tablet
{
  name: "Kamagra 100 mg tablet",
  price: 300,              // Base price per unit (strip)
  unitType: "strip",       // Can be "strip" or "pack"
  variants: [
    { quantity: 10, discount: 0 },    // 10 tablets, no discount
    { quantity: 25, discount: 20 },   // 25 tablets, 20% off
    { quantity: 50, discount: 30 }    // 50 tablets, 30% off
  ]
}
```

### Order Placement
When a customer orders, they select:
1. **Which variant** they want (e.g., 25 tablets at 20% off)
2. **How many units** they want (e.g., 2 strips)

```javascript
// Order item
{
  _id: "product-id",
  name: "Kamagra 100 mg tablet",
  price: 300,              // Base price
  quantity: 2,             // Number of strips
  unitType: "strip",
  selectedQuantity: 25,    // Variant: 25 tablets per strip
  discount: 20             // Variant: 20% discount
}
```

---

## Calculation Breakdown

### Example Order: 2 strips of 25-tablet variant at 20% discount

**Step 1: Apply Variant Discount**
- Base price per strip: ₹300
- Variant discount: 20%
- Discount amount: ₹300 × 20% = ₹60
- **Final price per strip: ₹300 - ₹60 = ₹240**

**Step 2: Calculate Subtotal**
- Final price per strip: ₹240
- Quantity ordered: 2 strips
- **Subtotal: ₹240 × 2 = ₹480**

**Step 3: Calculate Total Items**
- Strips ordered: 2
- Tablets per strip: 25
- **Total tablets: 2 × 25 = 50 tablets**

---

## Order Item Structure

### Input (from frontend)
```json
{
  "_id": "6947d156ab1ece4a5bdcbd43",
  "name": "Kamagra 100 mg tablet",
  "price": 300,
  "quantity": 2,
  "unitType": "strip",
  "selectedQuantity": 25,
  "discount": 20
}
```

### Stored in Database
```json
{
  "product": "6947d156ab1ece4a5bdcbd43",
  "name": "Kamagra 100 mg tablet",
  "price": 300,
  "quantity": 2,
  "unitType": "strip",
  "variant": {
    "quantityPerUnit": 25,
    "discount": 20
  },
  "totalItems": 50,
  "finalPrice": 240,
  "subtotal": 480
}
```

---

## Variant Validation

The system validates:
1. **Product exists** - Checks if product ID is valid
2. **Variant exists** - Verifies the selected variant (quantity + discount) exists in product
3. **Stock available** - Ensures enough stock for the quantity ordered

### Validation Example
```javascript
// Customer selects: 25 tablets at 20% discount
// System checks if product has this variant
const variant = product.variants.find(v => 
  v.quantity === 25 && v.discount === 20
);

if (!variant) {
  return error("Invalid variant selection");
}
```

---

## Real-World Scenarios

### Scenario 1: Single Variant Order
```json
{
  "items": [{
    "_id": "prod123",
    "name": "Medicine A",
    "price": 500,
    "quantity": 1,
    "unitType": "pack",
    "selectedQuantity": 10,
    "discount": 0
  }]
}
```
**Result:**
- 1 pack × 10 tablets = 10 tablets
- Price: ₹500 (no discount)
- Total: ₹500

---

### Scenario 2: Bulk Order with Discount
```json
{
  "items": [{
    "_id": "prod123",
    "name": "Medicine A",
    "price": 500,
    "quantity": 3,
    "unitType": "pack",
    "selectedQuantity": 50,
    "discount": 30
  }]
}
```
**Result:**
- 3 packs × 50 tablets = 150 tablets
- Base: ₹500 per pack
- Discount: 30% off = ₹150 per pack
- Final: ₹350 per pack
- Total: ₹350 × 3 = ₹1,050

---

### Scenario 3: Multiple Products with Different Variants
```json
{
  "items": [
    {
      "_id": "prod123",
      "name": "Medicine A",
      "price": 300,
      "quantity": 2,
      "selectedQuantity": 25,
      "discount": 20
    },
    {
      "_id": "prod456",
      "name": "Medicine B",
      "price": 400,
      "quantity": 1,
      "selectedQuantity": 10,
      "discount": 0
    }
  ]
}
```
**Result:**
- Medicine A: 2 strips × 25 tablets = 50 tablets @ ₹240/strip = ₹480
- Medicine B: 1 strip × 10 tablets = 10 tablets @ ₹400/strip = ₹400
- **Grand Total: ₹880**

---

## Stock Management

### Order Creation
When order is created:
```javascript
// Reduce stock by quantity of units (not total items)
product.stock -= order.quantity;  // e.g., stock -= 2 strips

// Increase sales count
product.sales += order.quantity;
```

### Order Cancellation
When order is cancelled:
```javascript
// Restore stock
product.stock += order.quantity;  // e.g., stock += 2 strips

// Decrease sales count
product.sales -= order.quantity;
```

**Note:** Stock is managed in units (strips/packs), not individual items (tablets).

---

## Frontend Integration

### Step 1: Display Variants
```javascript
// Show available variants to customer
product.variants.map(variant => ({
  label: `${variant.quantity} tablets`,
  price: product.price * (1 - variant.discount / 100),
  discount: variant.discount,
  savings: product.price * variant.discount / 100
}))
```

### Step 2: Customer Selection
```javascript
// When customer selects variant and quantity
const selectedVariant = { quantity: 25, discount: 20 };
const orderQuantity = 2;  // Number of strips

const orderItem = {
  _id: product._id,
  name: product.name,
  price: product.price,
  quantity: orderQuantity,
  unitType: product.unitType,
  selectedQuantity: selectedVariant.quantity,
  discount: selectedVariant.discount
};
```

### Step 3: Calculate Display Price
```javascript
const basePrice = product.price;
const discountAmount = basePrice * (selectedVariant.discount / 100);
const finalPrice = basePrice - discountAmount;
const subtotal = finalPrice * orderQuantity;
const totalItems = orderQuantity * selectedVariant.quantity;

// Display:
// "2 strips × 25 tablets (20% off)"
// "₹240 × 2 = ₹480"
// "Total: 50 tablets"
```

---

## API Response

### Create Order Response
```json
{
  "success": true,
  "orderNumber": "ORD-2025-000001",
  "order": {
    "items": [{
      "product": "...",
      "name": "Kamagra 100 mg tablet",
      "price": 300,
      "quantity": 2,
      "unitType": "strip",
      "variant": {
        "quantityPerUnit": 25,
        "discount": 20
      },
      "totalItems": 50,
      "finalPrice": 240,
      "subtotal": 480
    }],
    "subtotal": 480,
    "total": 480
  }
}
```

---

## Summary

**Key Points:**
1. Variants allow bulk discounts based on quantity
2. `selectedQuantity` = items per unit (variant option)
3. `quantity` = number of units ordered
4. `totalItems` = quantity × selectedQuantity
5. Stock is managed by units, not individual items
6. Variant must exist in product to be valid
7. Price calculation: base price → apply variant discount → multiply by quantity

**Your Example:**
- Product: Kamagra 100 mg tablet
- Base price: ₹300 per strip
- Selected variant: 25 tablets, 20% discount
- Order quantity: 2 strips
- Result: 50 tablets for ₹480 (₹9.60 per tablet)

---

## Testing

Test your order with:
```bash
POST /api/orders
{
  "formData": { ... },
  "items": [{
    "_id": "your-product-id",
    "name": "Product Name",
    "price": 300,
    "quantity": 2,
    "unitType": "strip",
    "selectedQuantity": 25,
    "discount": 20
  }],
  "total": 480
}
```

The system will:
1. ✅ Verify product exists
2. ✅ Verify variant (25 tablets, 20% off) exists
3. ✅ Check stock availability
4. ✅ Calculate prices
5. ✅ Create order
6. ✅ Update stock
