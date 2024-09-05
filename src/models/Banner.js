const mongoose = require('mongoose');

const bannerSchema = mongoose.Schema({
    banner_type: { type: String, required: false },
    banner_sequence: { type: Number, required: false },
    banner_text: { type: String, required: false },
    banner_path: { type: String, required: false },
    status: { type: String, default: 'Active', enum : ['Active', 'Inactive']},
}, { timestamps: true }
);

module.exports = mongoose.model('Banner', bannerSchema);