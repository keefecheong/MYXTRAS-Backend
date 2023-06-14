const { validateUserSocket } = require('../../middleware/general/authMiddleware.js');
const Chat = require('../../models/chat.js');
const Message = require('../../models/message.js');

// store user connection information
const connections = []

// socket.io event handler for chats
function chatHandler(io) {
    // create namespace for chats
    const chatNamespace = io.of('/chatSocket');

    chatNamespace
        // check if user is authenticated
        .use((socket, next) => {
            // pass to validateUserSocket middleware only if it is the first connection for the socket
            const existingConnection = connections.some((connection) => {
                connection.socketId.indexOf(socket.id) != -1;
            });

            if (!existingConnection) {
                validateUserSocket(socket, next);
            }
            
        })
        .on('connection', (socket) => {
            if (!socket.user) {
                socket.disconnect(true);
            }

            // manage user connection information
            let userConnectionIndex = connections.findIndex(connection => connection.userId == socket.user._id.toString());

            // if user does not have an existing socket then add the user id and socket id to connections
            if (userConnectionIndex == -1) {
                connections.push({
                    userId: socket.user._id.toString(),
                    socketId: [socket.id]
                });

                // tell all other sockets that this user is online
                socket.broadcast.emit('update-user-presence', {
                    userId: socket.user._id,
                    online: true
                });
            }
            // otherwise add the new socket id to the existing connection object
            else {
                connections[userConnectionIndex].socketId.push(socket.id);
            }

            // add socket to a room based on user id
            socket.join(socket.user._id.toString());

            // handle user disconnect
            socket.on('disconnect', () => {
                // remove socket id from the connections array
                let userConnectionIndex = connections.findIndex(connection => connection.userId == socket.user._id.toString());

                const socketIdIndex = connections[userConnectionIndex].socketId.indexOf(socket.id);
                connections[userConnectionIndex].socketId.splice(socketIdIndex, 1);

                // if there are no other associated sockets with the user then delete the whole object from the connections array
                if (connections[userConnectionIndex].socketId.length <= 0) {
                    connections.splice(userConnectionIndex, 1);

                    // tell all other sockets that this user is offline
                    socket.broadcast.emit('update-user-presence', {
                        userId: socket.user._id,
                        online: false
                    });
                }
            });

            // handle sent messages
            socket.on('send-message', async (data) => {
                // send message to all other sockets associated with sender (synchronize messages sent)
                socket.to(socket.user._id.toString()).emit('update-sent-message', {
                    message: data.message,
                    chat: data.chat
                });

                // check if recipient is online (has an existing socket connection)
                const recipient = connections.find(connection => connection.userId == data.chat.targetUserId) || null;

                if (recipient) {
                    // if recipient is online
                    // send message to all sockets associated with recipient user
                
                    // edit message for recipient
                    const recipientMessage = data.message;
                    recipientMessage.is_sender = false;

                    // edit chat for recipient
                    const recipientChat = {
                        _id: data.chat._id,
                        targetUserId: socket.user._id.toString(),
                        name: socket.user.username,
                        pic: socket.user.profile_pic_link
                    }

                    socket.to(data.chat.targetUserId).emit('recipient-receive-message', {
                        message: recipientMessage,
                        chat: recipientChat
                    });

                    // update typing status to false immediately
                    socket.to(data.chat.targetUserId).emit('receive-user-typing', {
                        userId: socket.user._id,
                        typing: false
                    });
                }

                // check if chat exists
                let chat = await Chat.findById(data.chat._id);

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

            // get user's presence (online/offline)
            socket.on('query-user-presence', (data, callback) => {
                const userOnline = connections.find(connection => connection.userId == data.targetUserId) || null;

                callback({
                    online: userOnline ? true : false
                });
            });

            // handle typing status updates
            socket.on('user-typing', (data) => {
                socket.to(data.targetUserId).emit('receive-user-typing', {
                    userId: socket.user._id,
                    typing: data.typing
                });
            });
        });
}

module.exports = {
    chatHandler
}