"use strict";
const { body, validationResult } = require("express-validator");
const Slots = require("../models/Slots");

exports.addSlot = [
    body("startTime")
        .notEmpty().withMessage("Start time is required")
        .isISO8601().withMessage("Start time must be a valid date")
        .custom((value) => {
            if (new Date(value) <= new Date()) {
                throw new Error("Start time must be in the future");
            }
            return true;
        }),
    body("endTime")
        .notEmpty().withMessage("End time is required")
        .isISO8601().withMessage("End time must be a valid date")
        .custom((value, { req }) => {
            if (new Date(value) <= new Date(req.body.startTime)) {
                throw new Error("End time must be strictly after start time");
            }
            return true;
        }),
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { startTime, endTime } = req.body;

        try {
            const overlappingSlot = await Slots.findOne({
                professorId: req.user.id,
                startTime: { $lt: endTime },
                endTime: { $gt: startTime }
            });

            if (overlappingSlot) {
                return res.status(409).json({
                    message: "This time slot overlaps with an existing slot.",
                    conflict: overlappingSlot
                });
            }


            const slot = await Slots.create({
                professorId: req.user.id,
                startTime: startTime,
                endTime: endTime
            });

            res.status(201).json({
                message: "Slot added successfully",
                data: slot
            });
        } catch (error) {
            res.status(500).json({ message: "Server error", error: error.message });
        }
    }
];

exports.deleteSlot = async (req, res) => {
    const slotId = req.params.slotId;
    try {
        const slot = await Slots.findOne({
            _id: slotId,
            professorId: req.user.id
        });

        if (!slot) return res.status(404).json({ message: "Slot not found or you do not have permission to delete it." });

        if (slot.status === "scheduled") {
            await Appointment.findOneAndUpdate(
                { slotId: slotId, status: "scheduled" },
                { status: "cancelled" }
            );
        }
        await Slots.deleteOne({ _id: slotId });

        res.status(200).json({ message: "Slot deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};

exports.slots = async (req, res) => {
    const { professorId } = req.params;
    const { status } = req.query;
    try {
        const queryObj = { professorId: professorId };
        if (status) queryObj.status = status;

        const slots = await Slots.find(queryObj);

        res.status(200).json({
            message: "Slots fetched successfully",
            data: slots
        });
    } catch (error) {
        res.status(500).json({ message: "Server error", error: error.message });
    }
};



