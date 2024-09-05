const mongoose = require('mongoose');

const SwappingHistory = mongoose.Schema({
    userId : { type: String, required: true },
    amount: { type: Number, required: true },
    short_name: { type: String, required: true },
    wallet: { type: String, required: true }
}, { timestamps: true }
);


module.exports = mongoose.model('SwappingHistory', SwappingHistory);