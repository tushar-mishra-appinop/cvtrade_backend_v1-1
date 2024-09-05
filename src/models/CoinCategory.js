const mongoose = require('mongoose');

const coinCategorySchema = mongoose.Schema(
    {
        category: { type: String, required: true }
    },
    { timestamps: true }
);

module.exports = mongoose.model('coincategory', coinCategorySchema)