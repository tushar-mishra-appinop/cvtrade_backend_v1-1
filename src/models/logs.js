const mongoose = require('mongoose');

const logSchema = mongoose.Schema({
    userId: { type: String },
    adminId: {type : String},
    date : { type: Date, required: true },
    IP: { type: String },
    adminIP: { type: String },
    Activity: { type: String, required: true }
},  { timestamps: true }
);


module.exports = mongoose.model('ActivityLogs', logSchema);