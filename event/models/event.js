const mongoose = require('mongoose');

const eventSchema = new mongoose.Schema({
    banner_link: {
        type: String,
    },
    event_name: {
        type: String,
        required: true,
    },
    event_desc: {
        type: String,
        required: true,
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

// deletes document one day after event_date
eventSchema.index({ 'event_date': 1 }, { expires: '1h' });

module.exports = mongoose.model('Event', eventSchema);