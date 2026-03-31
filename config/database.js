const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    let dbURI = process.env.MONGO_URI;
    if(process.env.NODE_ENV === "test") dbURI += "-test";

    const db = await mongoose.connect(dbURI);
    console.log('MongoDB Connected');
  } catch (err) {
    console.error(err);
  }
};

module.exports = connectDB;