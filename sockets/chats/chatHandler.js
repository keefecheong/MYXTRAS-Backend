const { validateUserSocket } = require('../../middleware/general/authMiddleware.js');

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
            // manage user connection information
            let userConnectionIndex = connections.findIndex(connection => connection.userId == socket.user._id.toString());

            // if user does not have an existing socket then add the user id and socket id to connections
            if (userConnectionIndex == -1) {
                connections.push({
                    userId: socket.user._id.toString(),
                    socketId: [socket.id]
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
                userConnectionIndex = connections.findIndex(connection => connection.userId == socket.user._id.toString());

                const socketIdIndex = connections[userConnectionIndex].socketId.indexOf(socket.id);
                connections[userConnectionIndex].socketId.splice(socketIdIndex, 1);

                // if there are no other associated sockets with the user then delete the whole object from the connections array
                if (connections[userConnectionIndex].socketId.length <= 0) {
                    connections.splice(userConnectionIndex, 1);
                }
            });

            // handle sent messages
            socket.on('send-message', (data) => {
                // TODO:
                // check if chat exists
                // const chatExists = 

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
                        id: data.chat.id,
                        targetUserId: socket.user._id.toString(),
                        name: socket.user.username,
                        pic: socket.user.profile_pic_link
                    }

                    socket.to(data.chat.targetUserId).emit('recipient-receive-message', {
                        message: recipientMessage,
                        chat: recipientChat
                    });
                }
                // if recipient is offline just push message to database
                else {
                    // TODO:
                    // add message to database
                }

                // TODO:
                // if chat does not exist then add to database
                // if (!chatExists) {

                // }
            });

            // get user's presence (online/offline)
            // socket.on('query-user-presence', );

            // handle typing status
            // socket.on('user-typing', );
        });
}

module.exports = {
    chatHandler
}