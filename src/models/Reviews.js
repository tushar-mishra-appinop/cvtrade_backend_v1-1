const mongoose = require('mongoose');

const reviewSchema = mongoose.Schema({
    userId: { type: String, required: true },
    reviewGivenBy: { type: String, required: true },
    message: { type: String, required: true }
}, { timestamp: true } 
);

module.exports = mongoose.model('User_Reviews', reviewSchema)