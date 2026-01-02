const Contact = require('../model/Contact.model');

// Create new contact submission
async function createContact(contactData) {
  try {
    const { name, email, phone, subject, message } = contactData;

    // Validate required fields
    if (!name || !email || !message) {
      return { 
        success: false, 
        message: 'Name, email, and message are required' 
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return { 
        success: false, 
        message: 'Invalid email format' 
      };
    }

    const contact = new Contact({
      name,
      email,
      phone,
      subject,
      message
    });

    await contact.save();

    return { 
      success: true, 
      message: 'Your message has been sent successfully. We will get back to you soon!',
      contact: {
        id: contact._id,
        name: contact.name,
        email: contact.email,
        subject: contact.subject,
        createdAt: contact.createdAt
      }
    };
  } catch (error) {
    console.error('Create contact error:', error);
    return { 
      success: false, 
      message: 'Failed to send message. Please try again later.', 
      error: error.message 
    };
  }
}

// Get all contact submissions (Admin only)
async function getAllContacts(filters = {}) {
  try {
    const { 
      status, 
      replied,
      limit = 50, 
      skip = 0, 
      sortBy = 'createdAt', 
      sortOrder = -1,
      search 
    } = filters;

    const query = {};
    
    if (status) query.status = status;
    if (replied !== undefined) query.replied = replied === 'true' || replied === true;
    
    // Search in name, email, subject, or message
    if (search) {
      query.$or = [
        { name: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { subject: { $regex: search, $options: 'i' } },
        { message: { $regex: search, $options: 'i' } }
      ];
    }

    const contacts = await Contact.find(query)
      .populate('repliedBy', 'name email')
      .sort({ [sortBy]: sortOrder })
      .limit(parseInt(limit))
      .skip(parseInt(skip));

    const total = await Contact.countDocuments(query);

    return {
      success: true,
      contacts,
      total,
      page: Math.floor(skip / limit) + 1,
      totalPages: Math.ceil(total / limit)
    };
  } catch (error) {
    console.error('Get contacts error:', error);
    return { 
      success: false, 
      message: 'Failed to fetch contacts', 
      error: error.message 
    };
  }
}

// Get contact by ID
async function getContactById(contactId) {
  try {
    const contact = await Contact.findById(contactId)
      .populate('repliedBy', 'name email');

    if (!contact) {
      return { success: false, message: 'Contact not found' };
    }

    return { success: true, contact };
  } catch (error) {
    console.error('Get contact error:', error);
    return { 
      success: false, 
      message: 'Failed to fetch contact', 
      error: error.message 
    };
  }
}

// Update contact status (Admin only)
async function updateContactStatus(contactId, status) {
  try {
    const validStatuses = ['new', 'in-progress', 'resolved', 'closed'];
    if (!validStatuses.includes(status)) {
      return { success: false, message: 'Invalid status' };
    }

    const contact = await Contact.findByIdAndUpdate(
      contactId,
      { status },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return { success: false, message: 'Contact not found' };
    }

    return { 
      success: true, 
      message: 'Status updated successfully',
      contact 
    };
  } catch (error) {
    console.error('Update contact status error:', error);
    return { 
      success: false, 
      message: 'Failed to update status', 
      error: error.message 
    };
  }
}

// Reply to contact (Admin only)
async function replyToContact(contactId, replyData, userId) {
  try {
    const { replyMessage } = replyData;

    if (!replyMessage) {
      return { success: false, message: 'Reply message is required' };
    }

    const contact = await Contact.findByIdAndUpdate(
      contactId,
      { 
        replied: true,
        replyMessage,
        repliedAt: new Date(),
        repliedBy: userId,
        status: 'resolved'
      },
      { new: true, runValidators: true }
    ).populate('repliedBy', 'name email');

    if (!contact) {
      return { success: false, message: 'Contact not found' };
    }

    // Here you could integrate email service to send reply to user
    // await sendReplyEmail(contact.email, contact.name, replyMessage);

    return { 
      success: true, 
      message: 'Reply sent successfully',
      contact 
    };
  } catch (error) {
    console.error('Reply to contact error:', error);
    return { 
      success: false, 
      message: 'Failed to send reply', 
      error: error.message 
    };
  }
}

// Update contact notes (Admin only)
async function updateContactNotes(contactId, notes) {
  try {
    const contact = await Contact.findByIdAndUpdate(
      contactId,
      { notes },
      { new: true, runValidators: true }
    );

    if (!contact) {
      return { success: false, message: 'Contact not found' };
    }

    return { 
      success: true, 
      message: 'Notes updated successfully',
      contact 
    };
  } catch (error) {
    console.error('Update contact notes error:', error);
    return { 
      success: false, 
      message: 'Failed to update notes', 
      error: error.message 
    };
  }
}

// Delete contact (Admin only)
async function deleteContact(contactId) {
  try {
    const contact = await Contact.findByIdAndDelete(contactId);

    if (!contact) {
      return { success: false, message: 'Contact not found' };
    }

    return { 
      success: true, 
      message: 'Contact deleted successfully' 
    };
  } catch (error) {
    console.error('Delete contact error:', error);
    return { 
      success: false, 
      message: 'Failed to delete contact', 
      error: error.message 
    };
  }
}

// Get contact statistics (Admin only)
async function getContactStats() {
  try {
    const stats = await Contact.aggregate([
      {
        $group: {
          _id: null,
          total: { $sum: 1 },
          new: {
            $sum: { $cond: [{ $eq: ['$status', 'new'] }, 1, 0] }
          },
          inProgress: {
            $sum: { $cond: [{ $eq: ['$status', 'in-progress'] }, 1, 0] }
          },
          resolved: {
            $sum: { $cond: [{ $eq: ['$status', 'resolved'] }, 1, 0] }
          },
          closed: {
            $sum: { $cond: [{ $eq: ['$status', 'closed'] }, 1, 0] }
          },
          replied: {
            $sum: { $cond: ['$replied', 1, 0] }
          },
          notReplied: {
            $sum: { $cond: ['$replied', 0, 1] }
          }
        }
      }
    ]);

    return {
      success: true,
      stats: stats[0] || {
        total: 0,
        new: 0,
        inProgress: 0,
        resolved: 0,
        closed: 0,
        replied: 0,
        notReplied: 0
      }
    };
  } catch (error) {
    console.error('Get contact stats error:', error);
    return { 
      success: false, 
      message: 'Failed to fetch statistics', 
      error: error.message 
    };
  }
}

module.exports = {
  createContact,
  getAllContacts,
  getContactById,
  updateContactStatus,
  replyToContact,
  updateContactNotes,
  deleteContact,
  getContactStats
};
