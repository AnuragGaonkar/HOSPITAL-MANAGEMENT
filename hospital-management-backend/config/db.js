const mongoose = require('mongoose');

// Reads from .env if present (MONGO_URI), otherwise falls back to a
// local Mongo instance with an explicit database name — this is the
// part that was missing before, which is why Compass never showed
// a "hospital-management" database.
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/hospital-management';

const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI, {});
    console.log(`MongoDB connected -> ${MONGO_URI}`);
  } catch (error) {
    console.error('Error connecting to MongoDB:', error);
    process.exit(1);
  }
};

module.exports = connectDB;