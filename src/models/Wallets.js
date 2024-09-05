const mongoose = require("mongoose");

const walletSchema = mongoose.Schema(
    {
        user_id: { type: String, required: true },
        status: { type: String, required: false, default: "Active" },
        currency: { type: String, required: true },
        currency_id: { type: String, required: true },
        short_name: { type: String, required: true },
        icon_path: { type: String, required: false },
        chain: { type: Array, required: true },
        locked_balance: { type: Number, required: false, default: 0 },
        balance: { type: Number, required: false, default: 0 },
        funding_wallet: { type: Boolean, default: false, required: true },
        spot_wallet: { type: Boolean, default: false, required: true },
        p2p_locked_balance: { type: Number, required: false, default: 0 },
        p2p_balance: { type: Number, required: false, default: 0 },
        checkAvailability: { type: String, required: false, default: ' ' },
        bonusCreditedIfPartner: { type: Boolean, default: false }
    },
    { timestamps: true }
);

module.exports = mongoose.model("wallet", walletSchema);
