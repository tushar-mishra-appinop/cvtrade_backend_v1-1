const mongoose = require('mongoose');

const orderNotification = mongoose.Schema({
    trader_id: { type: String, required: true },
    order_id: { type: String, required: true },
    postAd_user: { type: String, required: true },
    status: { type: String, required: true },
    message: { type: String, required: true }
}, { timestamps: true } 
);


module.exports = mongoose.model("orderNotification", orderNotification);