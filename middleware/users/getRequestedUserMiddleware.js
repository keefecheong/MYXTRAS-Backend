// middleware to get a post based on post id in request URL

const User = require('../../models/user.js');

// find user by id
const getUser = async (req, res, next) => {
    let target;

    try {
        target = await User.findById(req.params.userId);

        if (!target) {
            return res.status(404).json({ message: 'Unable to find the specified user.' });
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }

    res.user = target;
    next();
}

module.exports = {
    getUser,
}