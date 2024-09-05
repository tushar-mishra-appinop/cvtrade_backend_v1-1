const { optional, required } = require('joi');
const mongoose = require('mongoose');

const typesSchema = mongoose.Schema({
    transactionId: { type: String, default: '' },
    Image: String,
    fullName: String,
    State: String,
    Email: String,
    contact: String,
    PartnershipId: String,
    telergamId:{type:String, default:false},
    status: { 
        type: String, 
        enum: ['pending', 'approved', 'rejected'], 
        default: 'pending' 
    }
}, { timestamps: true });  

module.exports = mongoose.model('Partnership', typesSchema);
