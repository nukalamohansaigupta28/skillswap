const mongoose = require('mongoose');
const env = require('./env');

let mongodInstance = null;

const connectDB = async () => {
  try {
    // Attempt standard connection to specified URI
    const conn = await mongoose.connect(env.MONGODB_URI, {
      serverSelectionTimeoutMS: 3000
    });
    console.log(`[MongoDB] Connected successfully to host: ${conn.connection.host}`);
    return conn;
  } catch (primaryErr) {
    console.warn(`[MongoDB] Warning: Could not connect to primary URI (${env.MONGODB_URI}): ${primaryErr.message}`);
    
    // Fallback in development or test environment: use in-memory MongoDB instance
    if (env.NODE_ENV === 'development' || env.NODE_ENV === 'test') {
      try {
        console.log('[MongoDB] Starting fallback in-memory MongoDB instance...');
        const { MongoMemoryServer } = require('mongodb-memory-server');
        mongodInstance = await MongoMemoryServer.create();
        const memUri = mongodInstance.getUri();
        const conn = await mongoose.connect(memUri);
        console.log(`[MongoDB] Fallback in-memory MongoDB running at: ${memUri}`);
        return conn;
      } catch (fallbackErr) {
        console.error('[MongoDB] In-memory fallback failed:', fallbackErr.message);
        throw primaryErr;
      }
    } else {
      throw primaryErr;
    }
  }
};

const disconnectDB = async () => {
  try {
    await mongoose.disconnect();
    if (mongodInstance) {
      await mongodInstance.stop();
      mongodInstance = null;
    }
    console.log('[MongoDB] Disconnected successfully');
  } catch (err) {
    console.error('[MongoDB] Error during disconnect:', err.message);
  }
};

module.exports = { connectDB, disconnectDB };

