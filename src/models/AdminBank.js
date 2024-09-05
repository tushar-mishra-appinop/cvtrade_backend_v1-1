const mongoose = require('mongoose');

const adminBankDetails = mongoose.Schema({
    bank_name : { type : String, required : true },
    account_number : { type : Number, required: true },
    holder_name : { type: String, required: true },
    ifsc : { type: String, required: true },
    branch : { type: String, required: true }
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

module.exports = mongoose.model('Bank_details', adminBankDetails);
