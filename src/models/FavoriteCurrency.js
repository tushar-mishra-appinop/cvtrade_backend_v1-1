const mongoose = require('mongoose');
const favoriteSchema = mongoose.Schema(
    {
        userId: { type: String, required: true },
        pairs: { type: Array, default: [], required: false }
    },
    { timestamps: true }
)

module.exports = mongoose.model('favorites', favoriteSchema)