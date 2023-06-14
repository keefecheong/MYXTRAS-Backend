// middleware to get chat from chatId

const Chat = require('../../models/chat.js');

// find chat by id
const getChat = async (req, res, next) => {
    let target;

    try {
        target = await Chat.findById(req.params.chatId);
        
        // if chat does not exist return 404 error
        if (!target) {
            return res.status(404).json({ message: 'Unable to find specified chat.' });
        }

        // check if user is a member of the chat
        // if requesting user is not a member of the chat return 401 error
        if (target.users.indexOf(req.user._id) == -1) {
            return res.status(401).json({ message: 'Unauthorized' });
        }
    }
    catch (error) {
        return res.status(500).json({ message: error.message });
    }

    res.chat = target;
    next();
}

module.exports = {
    getChat
}