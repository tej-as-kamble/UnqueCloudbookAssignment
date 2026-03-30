"use strict";
const { body, validationResult } = require("express-validator");
const Appointment = require("../models/appointment"); // it is Appointment
const Slots = require("../models/Slots");

exports.bookAppointment = [
    body("slotId").notEmpty().withMessage("Slot ID is required"),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { slotId } = req.body;
        const studentId = req.user.id;
        let flag = false;

        try {
            const slot = await Slots.findOneAndUpdate(
                { _id: slotId, status: "available" },
                { status: "scheduled" },
                { new: true }
            );

            if (!slot) {
                return res.status(404).json({ message: "Slot is not available or does not exist." });
            }

            flag = true;

            const appointment = await Appointment.create({
                studentId: studentId,
                professorId: slot.professorId,
                slotId: slot._id,
                status: "scheduled"
            });

            res.status(201).json({
                message: "Appointment booked successfully",
                data: appointment
            });

        } catch (error) {
            if (flag) await Slots.updateOne({ _id: slotId }, { status: "available" });
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
];


exports.cancelAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    try {
        const appointment = await Appointment.findOne({
            _id: appointmentId,
            professorId: req.user.id
        });

        if (!appointment) {
            return res.status(404).json({ message: "Appointment not found or unauthorized." });
        }

        if (appointment.status === "cancelled" || appointment.status === "completed") {
            return res.status(400).json({ message: "Appointment is already cancelled or completed." });
        }

        appointment.status = "cancelled";
        await appointment.save();

        await Slots.updateOne(
            { _id: appointment.slotId },
            { status: "available" }
        );

        res.status(200).json({
            message: "Appointment cancelled successfully. Slot is now available.",
            data: appointment
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


exports.completeAppointment = async (req, res) => {
    const { appointmentId } = req.params;
    try {
        const appointment = await Appointment.findOneAndUpdate(
            { _id: appointmentId, professorId: req.user.id, status: "scheduled" },
            { status: "completed" },
            { new: true }
        );

        if (!appointment) {
            return res.status(404).json({ message: "Scheduled appointment not found or unauthorized." });
        }

        res.status(200).json({
            message: "Appointment marked as completed",
            data: appointment
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};


exports.appointments = async (req, res) => {
    const { status } = req.query;
    try {
        const queryObj = {};

        if (req.user.role === "student") {
            queryObj.studentId = req.user.id;
        } else if (req.user.role === "professor") {
            queryObj.professorId = req.user.id;
        } else {
            return res.status(403).json({ message: "Unauthorized role" });
        }

        if (status) queryObj.status = status;

        const appointmentsList = await Appointment.find(queryObj)
            .populate("professorId", "name email")
            .populate("slotId", "startTime endTime")
            .sort({ createdAt: -1 });

        res.status(200).json({
            message: "Appointments fetched successfully",
            data: appointmentsList
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};