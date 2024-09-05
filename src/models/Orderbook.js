const mongoose = require('mongoose');

const orderbookSchema = mongoose.Schema(
    {
        user_id: {type : String, required: true},
        order_type: { type: String, required: false, default: 'SPOT', enum: ['SPOT', 'LIMIT', 'STOP LIMIT', 'MARKET']},
        base_currency_id: {type : String, required: true},
        quote_currency_id: {type : String, required: true},
        ask_currency: { type: String, required: false },
        bid_currency: { type: String, required: false },
        side: { type: String, required: true, enum: ['BUY', 'SELL']},
        price:  { type: Number, required: true },
        quantity: { type: Number, required: true },
        filled: { type: Number, required: false, default: 0 },
        remaining: { type: Number, required: false },
        maker_fee: { type: Number, default: 0.1, required: false }, // Maker fee will be charged from who provide liquidity to the exchange
        taker_fee: { type: Number, default: 0.1, required: false }, // Taker fee will be charged from who take liquidity from the exchange 
        status: { type: String, required: false, default: 'PENDING'},
        transaction_fee:{ type: Number, required: true },
        tds: { type: Number, required: true },
        order_by: { type: String, defualt: '',required: false}
    },
    { timestamps: true }
)

module.exports = mongoose.model('orderbook', orderbookSchema)