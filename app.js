const express = require("express");
const cors = require('cors');
const dotenv = require('dotenv');

const authRoutes = require("./routes/authRoutes.js");
const slotsRoutes = require("./routes/slotsRoutes.js");
const appointmentRoutes = require("./routes/appointmentRoutes.js");


dotenv.config();

const app = express();
app.use(express.json());
app.use(cors());

const connectDB = require('./config/database');
connectDB();


app.use("/api/auth", authRoutes);
app.use("/api/user", slotsRoutes);
app.use("/api/appointments", appointmentRoutes);


const port = process.env.PORT || 3000;
app.listen(port, () => {
    console.log(`Server is running on port ${port}`);
});