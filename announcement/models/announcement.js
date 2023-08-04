const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
    user_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    banner_link: {
        type: String,
    },
    event_name: {
        type: String,
        required: true,
        immutable: true
    },
    event_desc: {
        type: String,
    },
    event_date: {
        type: Date,
        required: true,
    },
    event_location: {
        type: String,
        required: true,
    },
    event_color: {
        type: String,
        default: '#FF6363' // secondary color - light pink
    }
});

module.exports = mongoose.model('Announcement', announcementSchema);