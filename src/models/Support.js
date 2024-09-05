const mongoose = require('mongoose');
const { ObjectId } = require('mongodb')

// Account managment
const ticketSchema = mongoose.Schema(
    {
        query: { type: String, required: true },
        replyBy: { type: Number, enum: [0, 1], required: true }, //0 for admin, 1 for user
    },
    { timestamps: true }
);

const supportSchema = mongoose.Schema(
    {
        userId: { type: String, required: true },
        emailId: { type: String, required: true },
        query: { type: String, required: false },
        subject: { type: String, required: true },
        description: { type: String, required: true },
        order_id: { type: String, required: false },
        issueImage: { type: String, required: false, default: '' },
        ticket: { type: [ticketSchema], default: [] },
        status: { type: String, default: "Open" }, // OPEN or CLOSED
        seen: { type: Number, default: 0 }, //0 for admin, 1 for user
    },
    { timestamps: true }
);

module.exports = mongoose.model("support_tickets", supportSchema);