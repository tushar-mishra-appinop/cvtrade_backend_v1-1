const mongoose = require('mongoose');

const otpSchema = mongoose.Schema(
    {
        email_or_phone: { type: String, require: true },
        otp: { type: Number },
        createdAt: { type: Date, expires: '60m', default: Date.now}
    },
    { timestamps: true}
);

module.exports = mongoose.model('otps', otpSchema);