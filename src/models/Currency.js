const mongoose = require('mongoose');

const currencySchema = mongoose.Schema(
    {
        name: { type: String, required: true },
        status: { type: String, required: false, default: "Active" },
        short_name: { type: String, required: true },
        chain: { type: Array, required: true },
        category: { type: String, required: true },
        contract_address: { type: Object, required: true },
        icon_path: { type: String, required: true },
        decimals: { type: Object, required: true },
        maker_fee: { type: Number, default: 0.1, required: false }, // Maker fee will be charged from who provide liquidity to the exchange
        taker_fee: { type: Number, default: 0.1, required: false }, // Taker fee will be charged from who take liquidity from the exchange 
        min_withdrawal: { type: Number, default: 0.1, required: false },
        max_withdrawal: { type: Number, default: 0.1, required: false },
        fee: { type: Number, default: 0.0001, required: false },
        min_deposit: { type: Number, default: 0.1, required: false },
        max_deposit: { type: Number, default: 0.1, required: false },
        transaction_fee: { type: Number, default: 0.1, required: false },
        withdrawal_fee: { type: Number, default: 0.1, required: false },
        total_supply: { type: Number, default: 0, required: false },
        tds: { type: Number, default: 1, required: false },
        p2p : { type: Boolean, required: true, default: false},
        p2p_fiat : { type: Boolean, required: true, default: false},
        price: { type: Number, default: 0, required: false },
        description: { type: String, default: '', required: false },
        links: { type: Array, required: false, default: [] },
        deposit_status: { type: String, required: true, default: 'ACTIVE' },
        withdrawal_status: { type: String, required: true, default: 'ACTIVE' },
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
)

module.exports = mongoose.model("currency", currencySchema);