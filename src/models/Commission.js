const mongoose = require('mongoose');
// from_user, amount, fee, fee_type, percentage, currency_id, quantity
const adminCommission = mongoose.Schema(
    {
        currency_id: { type: String, required: true },
        from_user: { type: String, required: true },
        amount: { type: Number, required: false, default: 0},
        fee: { type: Number, required: false, default: 0},
        fee_type: { type: String, required: false },
        percentage: { type: String, required: false },
        quantity: { type: Number, required: false }
    },
    {
        timestamps: true
    }
)

module.exports = mongoose.model('admin_commission', adminCommission);