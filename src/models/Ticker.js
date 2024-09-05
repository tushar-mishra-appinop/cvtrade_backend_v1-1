const mongoose = require('mongoose');

const tickerSchema = mongoose.Schema(
    {
        base_currency_id: { type: String, required: true },
        quote_currency_id: { type: String, required: true },
        base_currency: { type: String, required: true },
        quote_currency: { type: String, required: true },
        open: { type: Number, required: false, default: 0},
        close: { type: Number, required: false, default: 0},
        high: { type: Number, required: false, default: 0},
        low: { type: Number, required: false, default: 0},
        volume: { type: Number, required: false, default: 0},
        time:  { type: Number, required: false}
    },
    { timestamps: true }
)

module.exports = mongoose.model('ticker', tickerSchema);