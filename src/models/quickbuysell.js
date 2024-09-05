const mongoose = require("mongoose");

const qbsSchema = mongoose.Schema(
  {
    userId: { type: String, required: true },
    from: { type: String, required: true },
    to: { type: String, required: true },
    base_currency_id: { type: String, required: true },
    quote_currency_id: { type: String, required: true },
    pay_amount: { type: Number, required: true },
    get_amount: { type: Number, required: true },
    side: { type: String, required: true },
  },
  { timestamps: true }
);

module.exports = mongoose.model("quickbuysell", qbsSchema);
