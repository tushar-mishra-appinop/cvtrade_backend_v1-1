const mongoose = require('mongoose');
const Users = require('./Users');

const kycSchema = mongoose.Schema(
    {
        userId: { type: String, required: true, unique: true },
        kyc_type: { type: String, default: 'Personal', enum: ['Personal',  'Company']},
        sub_kyc_type: { type: String, default: 'Personal', enum: ['Personal', "HUF", "Limited Liability Partnership", "Limited Company"]},
        first_name: { type: String, required: true },
        middle_name: { type: String, required: true },
        last_name: { type: String, required: true },
        emailId: { type: String, required: true },
        mobileNumber: { type: String, required: true },
        dob: { type: String, required: false },
        country: { type: String, required: false },
        address: { type: String, required: false },
        state: { type: String, required: false },
        city: { type: String, required: false },
        zip_code: { type: Number, required: false },
        pancard_number: { type: String, required: false },
        pancard_image: { type: String, required: false },
        document_type: { type: String, required: false, default: 'Aadhaar', enum: ['Aadhar',  'Passport', 'Driving License', 'Other']},
        document_number: { type: String, required: false },
        document_front_image: { type: String, required: false },
        document_back_image: { type: String, required: false },
        user_selfie: { type: String, required: false },
        currPrefrence: { type: String, default: "USDT", enum: ['USDT','BTC','INR', 'BNB']},
        ton_address: { type: String, required: false },
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
)

module.exports = mongoose.model("userdetails", kycSchema);