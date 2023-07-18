const mongoose = require('mongoose');

const missionSchema = new mongoose.Schema({

    title: { 
        type: String, 
        required: true 
    },
    description: { 
        type: String, 
        required: true 
    },
    gems: { 
        type: Number, 
        required: true 
    },

})

module.exports = mongoose.model('Mission', missionSchema);