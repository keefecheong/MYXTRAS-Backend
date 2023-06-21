const express = require('express');
const dislikeRouter = express.Router();

dislikeRouter.post('/', async (req, res) => {
    const dislikeExists = res.thread.dislikes.includes(req.user._id);
    // if the user has not liked the post, continue to add the like
    // otherwise, return 400 error
    if (dislikeExists) {
        return res.status(400).json({ message: 'You have already disliked this thread.' });
    }
    // update post's likes list
    res.thread.dislikes.push(req.user._id);

    try {
        await res.thread.save();
        res.status(201).end();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
});
dislikeRouter.delete('/', async (req, res) => {

     // check if the specified post is liked by the user
     const dislikeIndex = res.thread.dislikes.indexOf(req.user._id);
     // if the user has liked the post, continue to remove the like
     // otherwise, return 400 error
     if (dislikeIndex == -1) {
         return res.status(400).json({ message: 'You have not liked this thread.' });
     }
 
     // remove user id from post's likes list
     res.thread.dislikes.splice(dislikeIndex, 1);
 
     try {
         await res.thread.save();
         res.status(204).end();
     }
     catch (error) {
         res.status(500).json({ message: error.message });
     }
});

module.exports = dislikeRouter;