const mongoose = require('mongoose');
const Thread = require('./thread.js');

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
        default: function() {
            return Date.now();
        }
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

// craft query based on given arguments
forumSchema.statics.commonQuery = function (filter, cache, cacheOptions) {
    const query = this
        .find(filter)
        .select('forum_name forum_id forum_pic_link')
        .lean();

    if (cache) {
        query.cache(cacheOptions);
    }

    return query;
}

// remove user from subscribers list
forumSchema.statics.removeSubscriber = function(userId) {
    const filter = {
        subscribers: {
            $in: [userId]
        }
    };

    const update = {
        $pull: { subscribers: userId }
    };

    return { updateMany: { filter, update } };
}

// delete forums created by a user
forumSchema.statics.deleteByUser = async function(userId) {
    // delete forums
    const deleteForumsPromise = { deleteMany: { filter: { creator_id: userId } } };

    // clean up threads and comments
    const forums = await this.find({ creator_id: userId });
    const cleanUpThreads = await Thread.deleteAllSpecified(forums.map(forum => forum._id), null, true);

    return { ...cleanUpThreads, deleteForumsPromise };
}

// to clean up child threads and comments when forum is deleted
forumSchema.statics.cleanUpOnDeleteForum = async function(forumId) {
    return await Thread.deleteAllSpecified(forumId);
}

// on delete automatically clean up threads associated with the forum if any
forumSchema.post('findOneAndDelete', async function(doc, next) {
    this.model.cleanUpOnDeleteForum(doc._id).catch(error => console.log(error));

    next();
});

module.exports = mongoose.model('Forum', forumSchema);