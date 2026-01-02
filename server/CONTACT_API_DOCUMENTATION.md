# Contact Form API Documentation

## Overview
Complete API documentation for the contact form management system. This API allows users to submit contact forms and provides admin endpoints for managing submissions.

---

## Table of Contents
- [Authentication](#authentication)
- [Public Endpoints](#public-endpoints)
- [Admin Endpoints](#admin-endpoints)
- [Data Models](#data-models)
- [Error Handling](#error-handling)
- [Examples](#examples)

---

## Authentication

Admin endpoints require Bearer token authentication.

**Header:**
```
Authorization: Bearer YOUR_TOKEN_HERE
```

**Get Token:**
Login as admin using `/api/admin/login` endpoint.

---

## Public Endpoints

### 1. Submit Contact Form

**Endpoint:** `POST /api/contact`

**Description:** Submit a new contact form. No authentication required.

**Request Body:**
```json
{
  "name": "John Doe",
  "email": "john.doe@example.com",
  "phone": "1234567890",
  "subject": "Product Inquiry",
  "message": "I would like to know more about your products."
}
```

**Required Fields:**
- `name` (string) - Full name
- `email` (string) - Valid email address
- `message` (string) - Message content

**Optional Fields:**
- `phone` (string) - Phone number
- `subject` (string) - Subject line

**Success Response (201 Created):**
```json
{
  "success": true,
  "message": "Your message has been sent successfully. We will get back to you soon!",
  "contact": {
    "id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "subject": "Product Inquiry",
    "createdAt": "2026-01-03T10:30:00.000Z"
  }
}
```

**Error Responses:**

**Missing Required Fields (400 Bad Request):**
```json
{
  "success": false,
  "message": "Name, email, and message are required"
}
```

**Invalid Email Format (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid email format"
}
```

---

## Admin Endpoints

### 2. Get All Contacts

**Endpoint:** `GET /api/contact`

**Authentication:** Required (Admin)

**Description:** Retrieve all contact submissions with optional filters and pagination.

**Query Parameters:**
- `status` (string) - Filter by status: `new`, `in-progress`, `resolved`, `closed`
- `replied` (boolean) - Filter by reply status: `true` or `false`
- `search` (string) - Search in name, email, subject, or message
- `limit` (number) - Items per page (default: 50)
- `skip` (number) - Items to skip (default: 0)
- `sortBy` (string) - Sort field (default: `createdAt`)
- `sortOrder` (number) - Sort order: `1` (asc) or `-1` (desc)

**Example Request:**
```
GET /api/contact?status=new&limit=20&skip=0&sortBy=createdAt&sortOrder=-1
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "contacts": [
    {
      "_id": "507f1f77bcf86cd799439011",
      "name": "John Doe",
      "email": "john.doe@example.com",
      "phone": "1234567890",
      "subject": "Product Inquiry",
      "message": "I would like to know more...",
      "status": "new",
      "replied": false,
      "createdAt": "2026-01-03T10:30:00.000Z",
      "updatedAt": "2026-01-03T10:30:00.000Z"
    }
  ],
  "total": 45,
  "page": 1,
  "totalPages": 3
}
```

---

### 3. Get Contact Statistics

**Endpoint:** `GET /api/contact/stats`

**Authentication:** Required (Admin)

**Description:** Get overview statistics of all contacts.

**Success Response (200 OK):**
```json
{
  "success": true,
  "stats": {
    "total": 150,
    "new": 45,
    "inProgress": 30,
    "resolved": 60,
    "closed": 15,
    "replied": 90,
    "notReplied": 60
  }
}
```

---

### 4. Get Contact by ID

**Endpoint:** `GET /api/contact/:id`

**Authentication:** Required (Admin)

**Description:** Get detailed information about a specific contact.

**Success Response (200 OK):**
```json
{
  "success": true,
  "contact": {
    "_id": "507f1f77bcf86cd799439011",
    "name": "John Doe",
    "email": "john.doe@example.com",
    "phone": "1234567890",
    "subject": "Product Inquiry",
    "message": "I would like to know more about your products and pricing.",
    "status": "resolved",
    "replied": true,
    "replyMessage": "Thank you for your inquiry...",
    "repliedAt": "2026-01-03T14:30:00.000Z",
    "repliedBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "notes": "High priority customer",
    "createdAt": "2026-01-03T10:30:00.000Z",
    "updatedAt": "2026-01-03T14:30:00.000Z"
  }
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Contact not found"
}
```

---

### 5. Update Contact Status

**Endpoint:** `PATCH /api/contact/:id/status`

**Authentication:** Required (Admin)

**Description:** Update the status of a contact submission.

**Request Body:**
```json
{
  "status": "in-progress"
}
```

**Valid Status Values:**
- `new` - New submission
- `in-progress` - Being processed
- `resolved` - Issue resolved
- `closed` - Closed without resolution

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Status updated successfully",
  "contact": {
    "_id": "507f1f77bcf86cd799439011",
    "status": "in-progress",
    ...
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Invalid status"
}
```

---

### 6. Reply to Contact

**Endpoint:** `POST /api/contact/:id/reply`

**Authentication:** Required (Admin)

**Description:** Send a reply to a contact submission. Automatically marks as replied and updates status to resolved.

**Request Body:**
```json
{
  "replyMessage": "Thank you for contacting us. We have received your inquiry..."
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Reply sent successfully",
  "contact": {
    "_id": "507f1f77bcf86cd799439011",
    "replied": true,
    "replyMessage": "Thank you for contacting us...",
    "repliedAt": "2026-01-03T14:30:00.000Z",
    "repliedBy": {
      "_id": "507f1f77bcf86cd799439012",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "status": "resolved",
    ...
  }
}
```

**Error Response (400 Bad Request):**
```json
{
  "success": false,
  "message": "Reply message is required"
}
```

---

### 7. Update Contact Notes

**Endpoint:** `PATCH /api/contact/:id/notes`

**Authentication:** Required (Admin)

**Description:** Add or update internal notes for a contact. These notes are for admin use only.

**Request Body:**
```json
{
  "notes": "Customer interested in bulk order. Follow up with pricing details."
}
```

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Notes updated successfully",
  "contact": {
    "_id": "507f1f77bcf86cd799439011",
    "notes": "Customer interested in bulk order...",
    ...
  }
}
```

---

### 8. Delete Contact

**Endpoint:** `DELETE /api/contact/:id`

**Authentication:** Required (Admin)

**Description:** Delete a contact submission permanently.

**Success Response (200 OK):**
```json
{
  "success": true,
  "message": "Contact deleted successfully"
}
```

**Error Response (404 Not Found):**
```json
{
  "success": false,
  "message": "Contact not found"
}
```

---

## Data Models

### Contact Schema

```javascript
{
  name: String (required),
  email: String (required),
  phone: String (optional),
  subject: String (optional),
  message: String (required),
  status: String (enum: ['new', 'in-progress', 'resolved', 'closed']),
  replied: Boolean (default: false),
  replyMessage: String (optional),
  repliedAt: Date (optional),
  repliedBy: ObjectId (ref: 'User'),
  notes: String (optional),
  createdAt: Date (auto),
  updatedAt: Date (auto)
}
```

---

## Error Handling

All endpoints return consistent error responses:

**Error Response Format:**
```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message (in development)"
}
```

**Common HTTP Status Codes:**
- `200` - Success
- `201` - Created successfully
- `400` - Bad request (validation error)
- `401` - Unauthorized (missing or invalid token)
- `403` - Forbidden (insufficient permissions)
- `404` - Not found
- `500` - Server error

---

## Examples

### Example 1: Submit Contact Form

```bash
curl -X POST http://localhost:3000/api/contact \
  -H "Content-Type: application/json" \
  -d '{
    "name": "Jane Smith",
    "email": "jane@example.com",
    "phone": "9876543210",
    "subject": "Technical Support",
    "message": "I am facing an issue with my recent order."
  }'
```

### Example 2: Get New Contacts (Admin)

```bash
curl -X GET "http://localhost:3000/api/contact?status=new&limit=10" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

### Example 3: Reply to Contact (Admin)

```bash
curl -X POST http://localhost:3000/api/contact/507f1f77bcf86cd799439011/reply \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "replyMessage": "Thank you for reaching out. Our technical team has investigated your issue and we will send you a detailed solution via email within 24 hours."
  }'
```

### Example 4: Update Status (Admin)

```bash
curl -X PATCH http://localhost:3000/api/contact/507f1f77bcf86cd799439011/status \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "resolved"
  }'
```

### Example 5: Search Contacts (Admin)

```bash
curl -X GET "http://localhost:3000/api/contact?search=product&limit=20" \
  -H "Authorization: Bearer YOUR_TOKEN"
```

---

## Frontend Integration

### React/Vue/Angular Example

```javascript
// Submit Contact Form
const submitContact = async (formData) => {
  try {
    const response = await fetch('http://localhost:3000/api/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(formData)
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Message sent successfully!');
      // Reset form or redirect
    } else {
      alert(data.message);
    }
  } catch (error) {
    console.error('Error:', error);
    alert('Failed to send message. Please try again.');
  }
};

// Admin: Get All Contacts
const getContacts = async (filters) => {
  try {
    const queryString = new URLSearchParams(filters).toString();
    const response = await fetch(`http://localhost:3000/api/contact?${queryString}`, {
      headers: {
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      }
    });
    
    const data = await response.json();
    return data.contacts;
  } catch (error) {
    console.error('Error:', error);
  }
};

// Admin: Reply to Contact
const replyToContact = async (contactId, replyMessage) => {
  try {
    const response = await fetch(`http://localhost:3000/api/contact/${contactId}/reply`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${localStorage.getItem('token')}`
      },
      body: JSON.stringify({ replyMessage })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert('Reply sent successfully!');
    }
  } catch (error) {
    console.error('Error:', error);
  }
};
```

---

## Best Practices

### For Users:
1. ✅ Provide a valid email address for replies
2. ✅ Be clear and concise in your message
3. ✅ Include relevant details in the subject line
4. ✅ Check your spam folder for replies

### For Admins:
1. ✅ Respond to contacts promptly
2. ✅ Use status updates to track progress
3. ✅ Add internal notes for team reference
4. ✅ Archive or delete resolved contacts regularly
5. ✅ Use search and filters to manage submissions efficiently

---

## Testing

### Using Postman:
1. Import the `contact_postman_collection.json` file
2. Set environment variables:
   - `base_url`: Your API base URL
   - `auth_token`: Admin authentication token
3. Run the collection tests

### Using cURL:
See examples section above for cURL commands.

---

## Rate Limiting

Currently, there is no rate limiting on public endpoints. Consider implementing rate limiting for production:

```javascript
// Recommended: 5 submissions per IP per hour
```

---

## Future Enhancements

- [ ] Email notifications to admin on new contact
- [ ] Email notification to user when replied
- [ ] File attachments support
- [ ] Contact categories/tags
- [ ] Priority levels
- [ ] Bulk operations (mark multiple as read, delete)
- [ ] Export contacts to CSV
- [ ] Email templates for replies
- [ ] Two-way email integration

---

## Support

For API support or issues:
- Check server logs for errors
- Review this documentation
- Test with Postman collection
- Contact development team

---

**Last Updated:** January 3, 2026  
**API Version:** 1.0.0
