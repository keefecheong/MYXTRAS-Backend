// functions to check attributes of threads to set fields before returning to frontend

// adds fields to the thread object:
// 1. check if the requesting user is the owner of the thread
// 2. check if the requesting user has liked/disliked the thread
// for an array of threads
function checkThreadAttributesAll(threads, userId) {
    let result = [];

    for (let i = 0; i < threads.length; i ++) {
        result.push(checkThreadAttributes(threads[i], userId));
    }

    return result;
}

// for one thread
function checkThreadAttributes(thread, userId) {
    thread.isOwner = thread.creator_id._id.equals(userId);
    thread.liked = thread.likes.some(creator_id => creator_id.equals(userId));
    thread.disliked = thread.dislikes.some(creator_id => creator_id.equals(userId));
    
    return thread;
}

module.exports = {
    checkThreadAttributes,
    checkThreadAttributesAll
}