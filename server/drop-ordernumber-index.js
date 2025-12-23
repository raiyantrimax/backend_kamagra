// Script to drop old orderNumber index
require('dotenv').config();
const mongoose = require('mongoose');

async function dropOrderNumberIndex() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');
    
    const db = mongoose.connection.db;
    const collection = db.collection('orders');
    
    // Try to drop the orderNumber_1 index
    try {
      await collection.dropIndex('orderNumber_1');
      console.log('✅ Successfully dropped orderNumber_1 index');
    } catch (err) {
      if (err.code === 27) {
        console.log('ℹ️  Index orderNumber_1 does not exist (already removed)');
      } else {
        console.log('⚠️  Error dropping index:', err.message);
      }
    }
    
    // List all indexes
    console.log('\nCurrent indexes on orders collection:');
    const indexes = await collection.indexes();
    indexes.forEach(index => {
      console.log('- ', JSON.stringify(index.key), index.name);
    });
    
    await mongoose.connection.close();
    console.log('\n✅ Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

dropOrderNumberIndex();
