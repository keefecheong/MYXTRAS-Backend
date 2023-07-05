const mongoose = require('mongoose');

const forumSchema = new mongoose.Schema({
    creator_id: {
        type: mongoose.SchemaTypes.ObjectId,
        ref: 'User',
        required: true,
        immutable: true
    },
    creation_time: {
        type: Date,
        immutable: true,
        default: Date.now()
    },
    // Ex. NP InfoComm
    forum_name: {
        type: String,
        required: true,
    },
    // Ex. NPICT
    forum_id: {
        type: String,
        required: true,
        unique: true  // forum ID must be unique
    },
    forum_desc: {
        type: String
    },
    forum_pic_link: {
        type: String,
    },
    banner_link: {
        type: String,
    },
    tags: {
        type: [String],
        default: []
    },
    subscribers: {
        type: [{
            type: mongoose.SchemaTypes.ObjectId,
            ref: 'User'
        }],
        default: []
    }
});

// custom query to get creator details
forumSchema.query.getCreator = function() {
    return this.populate({
        path: 'creator_id',
        select: 'username profile_pic_link'
    });
}

// on delete automatically clean up threads associated with the forum if any
forumSchema.post('findOneAndDelete', async function(doc, next) {
    try {
        // get Thread model
        const threadModel = mongoose.model('Thread');

        // get all threads under this forum
        const associatedThreads = await threadModel.find({ parent_id: doc._id }, { '_id': 1 });
    
        const promises = [];
    
        // add promise to delete individual thread to trigger thread middleware to clean up comments as well
        for (let i = 0; i < associatedThreads.length; i++) {
            promises.push(threadModel.findByIdAndDelete(associatedThreads[i]._id));
        }
    
        // execute all promises
        Promise.all(promises).catch(error => console.log(error));

        next();
    }
    catch (error) {
        console.log(error);
    }
});

module.exports = mongoose.model('Forum', forumSchema);