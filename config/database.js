const mongoose = require('mongoose');

// main motive is to make sure different environment for test, prod and dev

const connectDB = async () => {
  try {
    const db = await mongoose.connect(process.env.MONGO_URI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err);
  }
};

module.exports = connectDB;