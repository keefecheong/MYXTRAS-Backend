// controller functions for chat socket message events

const Chat = require('../../models/chat.js');
const Message = require('../../models/message.js');

const { emitSocketEvent } = require('../../utils/chats/emitSocketEvent.js');
const { getUserOnline } = require('../../utils/chats/getUserStatus.js');
const { uploadFile } = require('../../utils/general/firebaseStorageUpload.js');

// handle 'send-message' event
async function handleSendMessage(data, socket, connections) {
    // do nothing if either user is blocked by the other user
    if (data.chat.blocked) {
        return;
    }

    let fileUpload;

    if (data.file) {
        // receive file chunks and upload to firebase storage if message includes file
        fileUpload = await processFileChunks(data, socket);
        
        // update sender on file upload results
        socket.emit('file-upload-result', { messageId: data.message._id, uploadResult: fileUpload });

        // if file upload is successful then set file attributes
        if (fileUpload.successful) {
            data.message.file_link = fileUpload.fileLink;
            data.message.original_name = data.file.name;
            data.message.file_type = data.file.type;
        }
        // otherwise return
        else {
            return;
        }
    }

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

        if (recipientMessage.reply_message) {
            recipientMessage.reply_message.is_sender = !recipientMessage.reply_message.is_sender;
        }

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
            chat_id: data.chat._id,
        });

        // set reply_message
        if (data.message.reply_message) {
            newMessage.reply_message = data.message.reply_message._id;
        }

        // set file attributes
        if (data.file) {
            newMessage.file_link = fileUpload.fileLink;
            newMessage.original_name = data.file.name;
            newMessage.file_type = data.file.type;
        }

        newMessage.save();
    });
}

// to receive file chunks and upload the file to firebase storage
function processFileChunks(data, socket) {
    return new Promise((resolve) => {
        const fileChunks = [];
        let file = null;

        // values for max file size and chunk size (tally with frontend)
        const maxFileSize = 2 * 1024 * 1024;
        const chunkSize = 4 * 1024;
    
        // set up event listener for file chunk data
        socket.on('file-chunk', async (chunkData) => {
            if (chunkData.message_id == data.message._id) {
                fileChunks.push(Buffer.from(chunkData.chunk));
            }

            // if the received number of chunks add up to be greater than maxFileSize then return upload fail
            if (fileChunks.length > Math.ceil(maxFileSize / chunkSize)) {
                resolve({
                    successful: false,
                    fileLink: ''
                });
            }
    
            // if the number of chunks received/added matches the total chunk count then reconstruct the file and upload to firebase storage
            if (fileChunks.length == data.file.totalChunks) {
                file = Buffer.concat(fileChunks);
                const uploadResult = await uploadFile(file, data.chat._id, data.file.name, data.file.type);

                // return the upload status and URL of the file
                resolve(uploadResult);
            }
        });
    });
}

// handle 'edit-message' event
function handleEditMessage(data, socket, connections) {
    // do nothing if either user is blocked by the other user
    if (data.chat.blocked) {
        return;
    }

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
        message.last_modified_time = data.message.last_modified_time
    
        message.save();
    });
}

// handle 'delete-message' event
function handleDeleteMessage(data, socket, connections) {
    // do nothing if either user is blocked by the other user
    if (data.chat.blocked) {
        return;
    }

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