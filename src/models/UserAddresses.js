const mongoose = require("mongoose");

const addressSchema = mongoose.Schema(
    {
        user_id: { type: String, required: true },
        currency_id: { type: String, required: true },
        chain: { type: String, required: true },
        address: { type: String, required: false, default: "" },
        private_key: { type: String, required: false, default: "" },
        short_name: { type: String, required: true },
        contract_address: { type: String, required: true },
    },
    { timestamps: true }
);

module.exports = mongoose.model("user_address", addressSchema);
