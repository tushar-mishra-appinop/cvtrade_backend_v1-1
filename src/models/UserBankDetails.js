const mongoose = require('mongoose');

const userBankSchema = mongoose.Schema(
    {
        type: { type: String, required: true },
        user_id: { type: String, required: true },
        bank_name: { type: String, required:true },
        account_type: { type: String, required:true },
        account_holder_name: { type: String, required:true },
        account_number: { type: String, required:true },
        ifsc_code: { type: String, required:true },
        branch_name: { type: String, required:true },
        verified: { type: Number, default: 0, required: false}
    }, { timestamps: true } 
)

module.exports = mongoose.model('user_bank_details', userBankSchema);