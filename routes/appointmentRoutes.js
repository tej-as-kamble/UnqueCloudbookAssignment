const express = require("express");
const router = express.Router();
const auth = require("../middlewares/auth");
const authorize = require("../middlewares/authorize");
const appointmentController = require("../controllers/appointmentController");


router.post("/book-appointment", auth, authorize(["student"]), appointmentController.bookAppointment);
router.put("/cancel-appointment/:appointmentId", auth, authorize(["professor"]), appointmentController.cancelAppointment);
router.put("/complete-appointment/:appointmentId", auth, authorize(["professor"]), appointmentController.completeAppointment);
router.get("/get-appointments", auth, appointmentController.appointments);


module.exports = router;

