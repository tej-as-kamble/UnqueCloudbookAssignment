"use strict";
const jwt = require("jsonwebtoken");
const bcrypt = require("bcryptjs");
const { body, validationResult } = require("express-validator");
const User = require("../models/User");


exports.register = [
    body("name").notEmpty().withMessage("Name is required"),
    body("email").notEmpty().withMessage("Email is required"),
    body("password").isLength({ min: 6 }).withMessage("Password must be at least 6 characters"),
    body("role").notEmpty().withMessage("Role is required"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, role } = req.body;

        try {
            const user = await User.findOne({ email });
            if (user) return res.status(400).json({ message: "Email already exists" });

            const hashedPassword = await bcrypt.hash(password, 10);

            await User.create({
                name,
                email,
                password: hashedPassword,
                role
            });

            res.status(201).json({ message: "User created successfully" });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
];


exports.login = [
    body("email").notEmpty().withMessage("Email is required"),
    body("password").notEmpty().withMessage("Password is required"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        try {
            const user = await User.findOne({ email });
            if (!user) {
                return res.status(400).json({ message: "Invalid credentials" });
            }

            const isMatch = await bcrypt.compare(password, user.password);
            if (!isMatch) return res.status(400).json({ message: "Invalid credentials" });

            const payload = { id: user._id, role: user.role };
            const accessToken = jwt.sign(
                payload,
                process.env.JWT_SECRET,
                { expiresIn: "1d" }
            );

            res.status(200).json({ message: "User login successfully", token: accessToken });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
];