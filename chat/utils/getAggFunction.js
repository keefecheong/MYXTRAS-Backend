// to get up to 15 messages before and after the given message (for admin panel reports)

const mongoose = require("mongoose");

module.exports = function getAggFunction(messageId) {
    return [
        // get original message
        {
            '$match': {
                '_id': new mongoose.Types.ObjectId(messageId)
            }
        },
        // get 15 closest previous messages
        {
            '$lookup': {
                'from': 'messages',
                'let': {
                    'chat_id': '$chat_id',
                    'id': '$_id',
                    'creation_time': '$creation_time'
                },
                'pipeline': [
                    {
                        '$sort': {
                            '_id': -1
                        }
                    },
                    {
                        '$match': {
                            '$and': [
                                {
                                    '$expr': {
                                        '$eq': [
                                            '$chat_id', '$$chat_id'
                                        ]
                                    }
                                },
                                {
                                    '$expr': {
                                        '$ne': [
                                            '$id', '$_id'
                                        ]
                                    }
                                },
                                {
                                    '$expr': {
                                        '$lt': [
                                            '$creation_time', '$$creation_time'
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$limit': 15
                    }
                ],
                'as': 'previous'
            }
        },
        // get 15 closest following messages
        {
            '$lookup': {
                'from': 'messages',
                'let': {
                    'chat_id': '$chat_id',
                    'id': '$_id',
                    'creation_time': '$creation_time'
                },
                'pipeline': [
                    {
                        '$match': {
                            '$and': [
                                {
                                    '$expr': {
                                        '$eq': [
                                            '$chat_id', '$$chat_id'
                                        ]
                                    }
                                },
                                {
                                    '$expr': {
                                        '$ne': [
                                            '$id', '$_id'
                                        ]
                                    }
                                },
                                {
                                    '$expr': {
                                        '$gt': [
                                            '$creation_time', '$$creation_time'
                                        ]
                                    }
                                }
                            ]
                        }
                    },
                    {
                        '$limit': 15
                    }
                ],
                'as': 'following'
            }
        },
        // merge the arrays and original document
        {
            '$project': {
                'messages': {
                    '$concatArrays': [
                        {
                            '$reverseArray': '$previous'
                        },
                        [
                            {
                                '_id': '$_id',
                                'creator_id': '$creator_id',
                                'content': '$content',
                                'creation_time': '$creation_time',
                                'last_modified_time': '$last_modified_time',
                                'chat_id': '$chat_id',
                                'file_ink': '$file_link',
                                'original_name': '$original_name',
                                'file_type': '$file_type',
                                'reply_message': '$reply_message'
                            }
                        ],
                        '$following'
                    ]
                },
                '_id': 0
            }
        },
        // populate reply_message
        {
            '$unwind': {
                'path': '$messages'
            }
        },
        {
            '$lookup': {
                'from': 'messages',
                'localField': 'messages.reply_message',
                'foreignField': '_id',
                'as': 'messages.reply_message'
            }
        },
        {
            '$group': {
                '_id': null,
                'messages': {
                    '$push': '$messages'
                }
            }
        }
    ]
}