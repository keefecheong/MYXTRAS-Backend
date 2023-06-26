const Chat = require('../../models/chat.js');

// get all enrolled chats of the requesting user
async function getEnrolledChats(req, res) {
    try {
        // get all chats with requesting user's user id in users
        const enrolledChats = await Chat
            .find({ users: req.user._id })
            .sort({ last_message_timestamp: -1 })
            .populate({
                path: 'users',
                select: 'username profile_pic_link'
            })
            .lean();
    
        const result = [];
    
        // if user has chats then format each chat to suit frontend parsing
        if (enrolledChats) {
            enrolledChats.forEach(chat => {
                result.push(formatChat(chat, req.user._id));
            });
        }  
    
        res.status(200).json({ chats: result });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// to check if the current user has an existing chat with another user
async function checkExistingChat(req, res) {
    try {
        var existingChat = await Chat
            .findOne({ 
                $or: [
                    { users: [req.user._id, req.params.userId] },
                    { users: [req.params.userId, req.user._id] }
                ]
            })
            .populate({
                path: 'users',
                select: 'username profile_pic_link'
            })
            .lean();

        // format existing chat if present
        if (existingChat) {
            existingChat = formatChat(existingChat, req.user._id);
        }

        // returns the existing chat if present, null otherwise
        res.status(200).json({ existingChat: existingChat });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

// to format retrieved chat to match front-end display
function formatChat(chat, userId) {
    const targetUser = chat.users.find(user => !user._id.equals(userId));
        
    const formattedChat = {
        _id: chat._id,
        targetUserId: targetUser._id,
        name: targetUser.username,
        pic: targetUser.profile_pic_link,
        last_message_timestamp: chat.last_message_timestamp
    };

    return formattedChat;
}

module.exports = {
    getEnrolledChats,
    checkExistingChat
}