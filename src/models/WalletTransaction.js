const mongoose = require('mongoose');

const walletTransaction = mongoose.Schema(
    {
        user_id: { type: String, required: true },
        order_id: { type: String, required: false },
        currency: { type: String, required: true },
        currency_id: { type: String, required: true },
        chain: { type: String, required: true },
        short_name: { type: String, required: true },
        deposit_slip: {type: String, required: false},
        transaction_number: { type: String, required: false },
        description : { type: String, default: '', required: false },
        amount: { type: Number, required: false , default: 0 },
        transaction_type: { type: String, required: false },
        transaction_hash: { type: String, required: false },
        fee: { type: Number, required: false , default: 0 },
        status: { type: String, required: false, default: ''},
        from_address: { type: String, required: false, default: ''},
        payment_type: { type: String, required: false, default: '' },
        admin_bank_details: { type: Object, required: false, default: {}},
        user_bank: { type: Object, required: false, default: {}},
        to_address: { type: String, required: false, default: ''}
    }, { timestamps: true }
)

module.exports = mongoose.model('wallet_transaction', walletTransaction);