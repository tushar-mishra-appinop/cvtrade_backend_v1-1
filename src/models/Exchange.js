const mongoose = require('mongoose');

const userTradeSchema = mongoose.Schema(
    {
        user_id: { type: String, required: true },
        order_id: { type: String, required: true },
        currency: { type: String, required: true },
        base_currency_id: { type: String, required: true },
        quote_currency_id: { type: String, required: true },
        quantity: { type: Number, default: 0, required: false },
        price: { type: Number, default: 0, required: false },
        side: { type: String, required: false },
        order_type: { type: String, required: false },
        fee: { type: Number, required: false, default: 0 },
        tds: { type: Number, required: false, default: 0 },
        time:  { 
            type: String, 
            default: () => new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' }) 
        },
        time1: {
            type: Number, // Change the type to Number for epoch time
            default: () => Math.floor(new Date().getTime() / 1000) // Convert current time to seconds since Unix epoch
        } // Custom function for Indian time

    },
    { timestamps: true }
);

module.exports = mongoose.model('recenttrade', userTradeSchema);
