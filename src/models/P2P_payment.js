const mongoose = require('mongoose');

const PaymentSchema = mongoose.Schema(
    {
        user_id : { type: String, required: true },
        payment_method: { type: Array, required: true}
    },
    { timestamps : true}
);


module.exports = mongoose.model('P2P_Payments_Method', PaymentSchema);