// controller functions to subscribe/unsubscribe from forums

// subscribe to forum
const subscribeToForum = async (req, res) => {
    try {
        // check if the requesting user has subscribed to the forum already
        const subscribed = res.forum.subscribers.find(creator_id => creator_id.equals(req.user._id));

        if (subscribed) {
            return res.status(400).json({ message: 'You have already subscribed to this forum.' });
        }

        // update forum subscriber list
        res.forum.subscribers.push(req.user._id);

        await res.forum.save();
        res.status(201).end();
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// unsubscribe from forum
const unsubscribeFromForum = async (req, res) => {
    try {
        // check if the requesting user has subscribed to the forum already
        const subscribedIndex = res.forum.subscribers.findIndex(creator_id => creator_id.equals(req.user._id));

        // if the user has not subscribed to the forum return 400 error
        if (subscribedIndex == -1) {
            return res.status(400).json({ message: 'You have not subscribed to this forum yet.' });
        }

        // remove user id from the forum subscriber list
        res.forum.subscribers.splice(subscribedIndex, 1);

        await res.forum.save();
        res.status(204).end();
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    subscribeToForum,
    unsubscribeFromForum
}