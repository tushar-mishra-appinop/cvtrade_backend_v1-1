const mongoose = require('mongoose');

const AdminUpiDetails = mongoose.Schema({
    upi_id : { type : String, required: true },
    upi_image : { type: String, required: true },
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

module.exports = mongoose.model('Admin_upi_details', AdminUpiDetails);
