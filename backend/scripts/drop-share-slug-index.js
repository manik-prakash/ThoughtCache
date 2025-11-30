// Script to drop the share_slug unique index from MongoDB
// Run with: node scripts/drop-share-slug-index.js

const mongoose = require('mongoose');
require('dotenv').config();

const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/second_brain';

async function dropIndex() {
  try {
    await mongoose.connect(MONGODB_URI);
    console.log('Connected to MongoDB');

    const db = mongoose.connection.db;
    const collection = db.collection('items');

    // Drop the share_slug_1 index
    try {
      await collection.dropIndex('share_slug_1');
      console.log('Successfully dropped share_slug_1 index');
    } catch (error) {
      if (error.code === 27) {
        console.log('Index share_slug_1 does not exist (already dropped)');
      } else {
        throw error;
      }
    }

    // List remaining indexes to verify
    const indexes = await collection.indexes();
    console.log('\nRemaining indexes:');
    indexes.forEach(index => {
      console.log(`- ${index.name}: ${JSON.stringify(index.key)}`);
    });

    await mongoose.disconnect();
    console.log('\nDisconnected from MongoDB');
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

dropIndex();

