// controller functions for chat socket message events

const Chat = require('../../models/chat.js');
const Message = require('../../models/message.js');

const { emitSocketEvent } = require('../../utils/chats/emitSocketEvent.js');
const { getUserOnline } = require('../../utils/chats/getUserStatus.js');

// handle 'send-message' event
function handleSendMessage(data, socket, connections) {
    // update last_message_timestamp with the message's creation_time
    data.chat.last_message_timestamp = data.message.creation_time;

    // send message to all other sockets associated with sender (synchronize messages sent)
    emitSocketEvent(socket, 'self', 'receive-message', { message: data.message, chat: data.chat });

    // if recipient is online
    // send message to all sockets associated with recipient user
    if (getUserOnline(connections, data.chat.targetUserId)) {    
        // edit message for recipient
        const recipientMessage = data.message;
        recipientMessage.is_sender = false;

        // edit chat for recipient
        const recipientChat = {
            _id: data.chat._id,
            targetUserId: socket.user._id.toString(),
            name: socket.user.username,
            pic: socket.user.profile_pic_link,
            last_message_timestamp: data.chat.last_message_timestamp
        }

        emitSocketEvent(socket, data.chat.targetUserId, 'receive-message', { message: recipientMessage, chat: recipientChat });
        
        // update typing status to false immediately
        emitSocketEvent(socket, data.chat.targetUserId, 'receive-user-typing', { userId: socket.user._id, typing: false });
    }

    // update database

    // check if chat exists
    Chat.findById(data.chat._id).then(chat => {
        // if chat does not exist then add to database
        if (!chat) {
            chat = new Chat({
                _id: data.chat._id,
                users: [
                    data.chat.targetUserId,
                    socket.user._id
                ]
            });

            chat.save();
        }

        // add message to database
        const newMessage = new Message({
            _id: data.message._id,
            creator_id: socket.user._id,
            content: data.message.content,
            creation_time: data.message.creation_time,
            chat_id: data.chat._id
        });

        newMessage.save();

        // update last_message_timestamp for the chat
        chat.last_message_timestamp = newMessage.creation_time;
        chat.save();
    });
}

// handle 'edit-message' event
function handleEditMessage(data, socket, connections) {
    const editEvent = 'receive-edit-message';
    const sendData = { message: data.message };

    // send edited message to all other sockets associated with sender (synchronize message)
    emitSocketEvent(socket, 'self', editEvent, sendData);

    // if recipient is online
    // send the edited message to all sockets associated with recipient user
    if (getUserOnline(connections, data.targetUserId)) {
        emitSocketEvent(socket, data.targetUserId, editEvent, sendData);
    }

    // update database
    Message.findById(data.message._id).then(message => {
        message.content = data.message.content;
    
        message.save();
    });
}

// handle 'delete-message' event
function handleDeleteMessage(data, socket, connections) {
    const deletedEvent = 'receive-delete-message';
    const sendData = { message: data.message };

    // send deleted message to all other sockets associated with sender (synchronize message)
    emitSocketEvent(socket, 'self', deletedEvent, sendData);

    // if recipient is online
    // send the deleted message to all sockets associated with recipient user
    if (getUserOnline(connections, data.targetUserId)) {
        emitSocketEvent(socket, data.targetUserId, deletedEvent, sendData);
    }

    // update database
    Message.findByIdAndDelete(data.message._id).catch((error) => console.log(error));
}

module.exports = {
    handleSendMessage,
    handleEditMessage,
    handleDeleteMessage
}