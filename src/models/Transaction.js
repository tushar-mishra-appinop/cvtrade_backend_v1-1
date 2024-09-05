const mongoose = require('mongoose');

const walletTransaction = mongoose.Schema(
    {
        user_id: { type: String, required: true },
        order_id: { type: String },
        currency: { type: String, required: true },
        currency_id: { type: String, required: true },
        quantity: { type: Number, default: 0, required: false },
        price: { type: Number, default: 0, required: false },
        amount: { type: Number, required: false , default: 0 },
        side: { type: String, required: false },
        transaction_type: { type: String, required: false },
        order_type: { type: String, required: false },
        fee: { type: Number, required: false , default: 0 },
        fee_type: { type: String, required: false , default: 0 },
        tds: { type: Number, required: false , default: 0 },
    }, { timestamps: true }
)

module.exports = mongoose.model('user_trade_transaction', walletTransaction);