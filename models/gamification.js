const mongoose = require('mongoose');


const gamificationSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    last_checkin_date: {
        type: Date,
    },
    checkin_count: {
        type: Number,
        default: 1
    },
    claimed: {
        type: Boolean,
        default: false
    }
})


module.exports = mongoose.model('Gamification', gamificationSchema);