// controller functions to handle GET requests for threads

const Thread = require('../../models/thread.js');
const { checkThreadAttributes, checkThreadAttributesAll } = require('../../utils/forums/checkAttributes.js');

// get all threads
const getAll = async (req, res) => {
    try {
        var threads = await Thread.find()
        .populate({ 
            path: 'creator_id',
            select: 'username profile_pic_link'
        })
        .sort({ creation_time: -1 })
        .lean();

        threads = checkThreadAttributesAll(threads, req.user._id);

        res.status(200).json(threads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// get threads associated with a forum
const getForumThreads = async (req, res) => {
    try {
        var threads =  await Thread.find({parent_id: req.params.forumID})
        .populate({ 
            path: 'creator_id',
            select: 'username profile_pic_link'
        })
        .sort({ creation_time: -1 })
        .lean();

        threads = checkThreadAttributesAll(threads, req.user._id);

        res.status(200).json(threads);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// get one thread based on id
const getOneThread = async (req, res) => {
    try {
        const thread = checkThreadAttributes(res.thread, req.user._id);

        res.status(200).json(thread);
    } catch (error) {
        return res.status(500).json({ message: error.message });
    }
}

// get popular threads
const getPopularThreads = async (req, res) => {
    var threads = await Thread.find()
    .populate({ 
        path: 'creator_id',
        select: 'username profile_pic_link'
    })
    .sort({ likes: -1 })
    .limit(6)
    .lean();

    threads = checkThreadAttributesAll(threads, req.user._id);

    res.status(200).json(threads);
}

module.exports = {
    getAll,
    getForumThreads,
    getOneThread,
    getPopularThreads
}