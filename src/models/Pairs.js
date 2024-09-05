const mongoose = require('mongoose');

const pairSchema = mongoose.Schema(
    {
        type: { type: String, required: false, default: 'SPOT', enum: ['SPOT', 'LIMIT', 'STOP LIMIT', 'MARKET']},
        status: { type: String, required: false, default: "Active" },
        base_currency: { type: String, required: true },
        base_currency_id: { type: String, required: true },
        quote_currency: { type: String, required: true },
        category: { type: String, required: true },
        quote_currency_id: { type: String, required: true },
        available: { type: String, required: false, default: 'GLOBAL', enum: ['GLOBAL', 'LOCAL']},
        icon_path: { type: String, required: false},
        buy_price: { type: Number, required: false, default: 0}, //BID price
        sell_price: { type: Number, required: false, default: 0}, // ASK price
        change: { type: Number, required: false, default: 0},
        change_24hour: { type: Number, required: false, default: 0},
        high: { type: Number, required: false, default: 0},
        low: { type: Number, required: false, default: 0},
        open: { type: Number, required: false, default: 0},
        close: { type: Number, required: false, default: 0},
        volume: { type: Number, required: false, default: 0},
        trading_bot: { type: Boolean, required: false, default: true},
        trading_bot_gap: { type: Number, require: false, default: 1},
        base_currency_fullname : { type: String, required: true }
    },
    { timestamps: true }
)

module.exports = mongoose.model('currency_pairs', pairSchema)