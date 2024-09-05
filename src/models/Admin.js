const mongoose = require('mongoose');

const adminSchema = mongoose.Schema(
    {
        email_or_phone: { type: String, required: true },
        password: { type: String, required: true },
        first_name: { type: String, required: true },
        last_name: { type: String, required: true },
        permissions: { type: Array, default: [], required: false },
        maintenance: { type: Boolean, default: false },
        status : {type: String, default: "Active", enum: ['Inactive', 'Active']},
        admin_type: { type: Number, default: 0 , enum: [0,1], required: true } // 1 - master admin 0 - Sub admin
    }, { timestamps: true }
)

module.exports = mongoose.model('admin', adminSchema);