const mongoose = require("mongoose");
// const { total_refer_count } = require("../controllers/UserController");

const userSchema = mongoose.Schema(
    {
        firstName: { type: String, required: false, default: '' },
        lastName: { type: String, required: false, default: '' },
        emailId: { type: String, required: false, default: '' },
        sub: { type: String, required: false, default: '' },
        mobileNumber: { type: String, required: false, default: '' },
        profilepicture: { type: String, required: false, default: '' },
        password: { type: String, required: false },
        country_code: { type: String, required: false, default: '+91'},
        registerdBy: { type: String, default: "email", enum: ['email', 'phone']},
        status: { type: String, required: false, default: 'Active'},
        verified: { type: Number, default: 1, enum: [0, 1], required: false }, // 0 for pending 1 for verified
        ['2fa']: { type: Number, default: 0, enum: [0, 1, 2, 3], required: false}, // 0-Disable, 1-email, 2-mobile, 3-google
        google_auth: { type: Object, default: null, required: false},
        buy_sell_model_skip: { type: Boolean, default: false, enum: [true, false], required: false},
        currency_prefrence: { type: String, default: "USDT", enum: ['USDT','BTC','INR']},
        kycVerified: { type: Number, default: 0 , enum: [0,1,2,3], required: false}, // 0-Not Submitted, 1-Pending for approval, 2-verified, 3-Rejected
        kyc_reject_reason: { type: String, default: '', required: false },
        userRatings: { type: Number, default: 0, required: false },
        master_account: { type: Boolean, default: true, required:  false},
        maker_fee: { type: Number, default: 0, required:  false },
        taker_fee: { type: Number, default: 0, required:  false },
        p2p_trades: { type: Number, default: 0, required:  false },
        counterCurrency: {type: String, required: false, default: ''},
        currencyAmount: {type: Number, required: false, default: ''},
        registeredDays: {type: Number, required: false, default: 0},
        order_id : { type: Array, default: [], required: false },
        p2p_2fa : { type: Number, default: 0, required: false },
        total_refer: {type: Number, default: 0, required: false}
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
);

module.exports = mongoose.model("login", userSchema);




