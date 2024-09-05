const mongoose = require('mongoose');

const typesSchema = mongoose.Schema({
    payment_type : { type: String, required: true, default: '' }
}, { timestamps: true }
);

module.exports = mongoose.model('PaymentTypes', typesSchema);