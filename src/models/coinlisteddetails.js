const mongoose = require('mongoose');

const typesSchema = mongoose.Schema({
    ProjectName: String,
    contractAddress: String,
    ContactName: String,
    TelegramID: String,
    WhatsappID: String,
    PhoneNumber: Number,
    emailID: String,
    referredBy: String,
    countryCode : String,
    comments: String,
    status: { 
        type: String, 
        enum: ['pending', 'completed', 'rejected'], 
        default: 'pending' 
    }
}, { timestamps: true });  

module.exports = mongoose.model('CoinListedDetails', typesSchema);
