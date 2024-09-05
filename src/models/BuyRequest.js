const mongoose = require("mongoose");


const BuySchema = mongoose.Schema({
    user_id : { type: String, required: false },
    trader_id : { type: String, required: true },
    sponser_user : { type: String, required: true },
    side : { type: String, required: true },
    base_currency : { type: String, required: true },
    base_short_name : { type: String, required: true },
    quote_currency : { type: String, required: true },
    quote_short_name : { type: String, required: true },
    amount : { type : Number, required: true },
    receiving_amount : { type : Number, required: true },
    price_type : { type: String, required: false },
    fixed_price: { type: Number, required: false , default: 0 },
    min_amount: { type: Number, required: false , default: 0 },
    max_amount: { type: Number, required: false , default: 0 },
    payment_method: { type: Array, required: false },
    payment_timestamp: { type: String, required: true },
    payment_time: { type: String, required: true },
    payment_type: { type: String, required: true },
    remark: { type: String, required: false },
    status: { type: String, required: false, default: ''},
    fee: { type: Number, required: false , default: 0 },
    createdAtInSeconds: {type: String, required: true}
}, { timestamps : true }
);

// // Add a virtual property to calculate the timestamp in seconds
// BuySchema.virtual('createdAtInSeconds').get(function () {
//     return Math.floor(this.createdAt.getTime() / 1000);
//   });

module.exports = mongoose.model('Buy_requests', BuySchema);