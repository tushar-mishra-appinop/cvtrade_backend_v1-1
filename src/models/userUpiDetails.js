const mongoose = require('mongoose');

const userUpiDetails = mongoose.Schema({
    type: { type: String, required: true },
    user_id : { type: String, required: true },
    upi_id : { type : String, required: true },
    upi_image : { type: String, required: true },
    verified: { type: Number, default: 0, required: false}
}, 
{
    timestamps: true,
    toJSON: {
        virtuals: true,
    },
    toObject: {
        virtuals: true,
    },
}
);

module.exports = mongoose.model('user_upi_details', userUpiDetails);
