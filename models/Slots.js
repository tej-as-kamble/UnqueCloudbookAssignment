const mongoose = require("mongoose");

const slotsSchema = new mongoose.Schema({
    professorId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    startTime: {
        type: Date,
        required: true
    },
    endTime: {
        type: Date,
        required: true
    },
    status: {
        type: String,
        enum: ['available', 'scheduled'],
        default: 'available'
    }
});

module.exports = mongoose.model("Slots", slotsSchema);


