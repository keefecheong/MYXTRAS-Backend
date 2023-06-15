const Chat = require('../../models/chat.js');

// get all enrolled chats of the requesting user
async function getEnrolledChats(req, res) {
    try {
        // get all chats with requesting user's user id in users
        const enrolledChats = await Chat
            .find({ users: req.user._id })
            .sort({ last_message_timestamp: -1 })
            .populate('users');
    
        const result = [];
    
        // if user has chats then format each chat to suit frontend parsing
        if (enrolledChats) {
            enrolledChats.forEach(chat => {
                const targetUser = chat.users.find(user => !user._id.equals(req.user._id));
        
                const formattedChat = {
                    _id: chat._id,
                    targetUserId: targetUser._id,
                    name: targetUser.username,
                    pic: targetUser.profile_pic_link,
                    last_message_timestamp: chat.last_message_timestamp
                };
        
                result.push(formattedChat);
            });
        }  
    
        res.status(200).json({ chats: result });
    }
    catch (error) {
        res.status(500).json({ message: error.message });
    }
}

module.exports = {
    getEnrolledChats
}