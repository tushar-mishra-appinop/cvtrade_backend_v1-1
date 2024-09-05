const mongoose = require('mongoose');

const chainAddress = mongoose.Schema(
    {
        userId: { type: String, required: true },
        chain: { type: String, required: true, default: 'BEP20' },
        address: { type: String, required: true, default: '' },
        private_key: { type: String, required: false, default: ''}
    },
    { timestamps: true }
)

module.exports = mongoose.model('user_addresses', chainAddress);