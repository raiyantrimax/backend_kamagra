require('dotenv').config();
const mongoose = require('mongoose');
const User = require('./model/Users.model');

async function fixAdminUser() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    // Update admin user to add name field if missing
    const result = await User.updateOne(
      { email: 'adminuser@adminuser.com', name: { $exists: false } },
      { $set: { name: 'Admin User' } }
    );

    if (result.modifiedCount > 0) {
      console.log('✓ Admin user updated successfully with name field');
    } else {
      console.log('Admin user already has a name field or does not exist');
    }

    await mongoose.disconnect();
    console.log('Disconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

fixAdminUser();
