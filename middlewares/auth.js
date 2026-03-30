"use strict";
const jwt = require("jsonwebtoken");

const auth = async (req, res, next) => {
  try {
    const token = req.header("Authorization")?.replace("Bearer ", "");
    if (!token) {
      return res.status(401).json({ message: "No token provided" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    // console.log(decoded);

    req.user = decoded;
    next();
  } catch(error) {
    res.status(401).json({ message: "Invalid token", error: error.message });
  }
};

module.exports = auth;
