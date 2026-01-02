const express = require('express');
const router = express.Router();
const contactService = require('../services/contact.service');
const { authenticateUser, requireRole } = require('../middleware/auth');

// POST /api/contact - Submit contact form (Public)
router.post('/contact', async (req, res) => {
  try {
    const { name, email, phone, subject, message } = req.body;
    const result = await contactService.createContact({ 
      name, 
      email, 
      phone, 
      subject, 
      message 
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

// GET /api/contact - Get all contacts (Admin only)
router.get('/contact', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { status, replied, limit, skip, sortBy, sortOrder, search } = req.query;
    const result = await contactService.getAllContacts({
      status,
      replied,
      limit,
      skip,
      sortBy,
      sortOrder,
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

// GET /api/contact/stats - Get contact statistics (Admin only)
router.get('/contact/stats', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const result = await contactService.getContactStats();

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

// GET /api/contact/:id - Get contact by ID (Admin only)
router.get('/contact/:id', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const result = await contactService.getContactById(req.params.id);

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

// PATCH /api/contact/:id/status - Update contact status (Admin only)
router.patch('/contact/:id/status', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { status } = req.body;
    const result = await contactService.updateContactStatus(req.params.id, status);

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

// POST /api/contact/:id/reply - Reply to contact (Admin only)
router.post('/contact/:id/reply', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { replyMessage } = req.body;
    const result = await contactService.replyToContact(
      req.params.id, 
      { replyMessage }, 
      req.user.id
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

// PATCH /api/contact/:id/notes - Update contact notes (Admin only)
router.patch('/contact/:id/notes', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const { notes } = req.body;
    const result = await contactService.updateContactNotes(req.params.id, notes);

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

// DELETE /api/contact/:id - Delete contact (Admin only)
router.delete('/contact/:id', authenticateUser, requireRole('admin', 'super_admin'), async (req, res) => {
  try {
    const result = await contactService.deleteContact(req.params.id);

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

module.exports = router;
