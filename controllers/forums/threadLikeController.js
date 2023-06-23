// controller functions for adding/removing likes for threads

// add like to thread
const addLikeThread = async (req, res) => {
    const likeExists = res.thread.likes.includes(req.user._id);

    // if the user has not liked the post, continue to add the like
    // otherwise, return 400 error
    if (likeExists) {
        return res.status(400).json({ message: 'You have already liked this thread.' });
    }
    // update post's likes list
    res.thread.likes.push(req.user._id);

    try {
        await res.thread.save();
        res.status(201).end();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// remove like from thread
const removeLikeThread = async (req, res) => {
     // check if the specified post is liked by the user
     const likeIndex = res.thread.likes.indexOf(req.user._id);

     // if the user has liked the post, continue to remove the like
     // otherwise, return 400 error
     if (likeIndex == -1) {
         return res.status(400).json({ message: 'You have not liked this thread.' });
     }
 
     // remove user id from post's likes list
     res.thread.likes.splice(likeIndex, 1);
 
     try {
         await res.thread.save();
         res.status(204).end();
     }
     catch (error) {
         res.status(500).json({ message: error.message });
     }
}

module.exports = {
    addLikeThread,
    removeLikeThread
}