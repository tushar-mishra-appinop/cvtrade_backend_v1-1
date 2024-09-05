const { optional, required } = require("joi");
const mongoose = require("mongoose");

const partnershipSchema = mongoose.Schema(
  {
    userName: { type: String, required: false },
    profilePicture: { type: String, required: false },
    phoneNumber: { type: String, required: false },
    country_code:{ type: String, required: false , default:"+91"},
    transactionId : { type: String, required: false},
    transactionImage: { type: String, required: false },
    email: { type: String, required: true },
    PartnershipId: { type: String, required: true },
    type: { type: Number, default: 0, enum: [0, 1] }, // 0 for paymented partners, 1 for admin referred partners
    password: { type: String, required: true },
    status: { type: String, default: "INACTIVE", enum: ["ACTIVE", "INACTIVE"] },
    admin_apporval: {
      type: String,
      enum: ['PENDING', 'APPROVED', 'REJECTED'],
      default: 'PENDING'
    }
  },
  { timestamps: true }
);

module.exports = mongoose.model("PartnershipLogin", partnershipSchema);
