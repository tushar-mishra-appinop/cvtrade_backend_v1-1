const Users = require("../models/Users");
const Messages = require('../models/Messages');

module.exports = {

    get_friends: async (req, res) => {
        try {
            const { userId } = req.user;
            const { friendId, order_id } = req.body;
            let friend_msg = [];

            let getFriend = await Users.find({
                _id: friendId 
            });


            let lastMessage = await module.exports.getLastMessage(userId, getFriend._id, order_id);

            friend_msg = [...friend_msg, {
                friendInfo: getFriend,
                msgInfo: lastMessage
            }]

            return res.status(200).json({ success: true, message: "My friends", data: friend_msg });

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    getLastMessage: async (userId, frndId, order_id) => {
        try {
            let msg = await Messages.findOne({
                $or: [{
                    $and: [{
                        senderId: {
                            $eq: userId
                        }
                    }, {
                        recieverId: {
                            $eq: frndId
                        }
                    }, {
                        order_id: order_id
                    }]
                }, {
                    $and: [{
                        senderId: {
                            $eq: frndId
                        }
                    }, {
                        recieverId: {
                            $eq: userId
                        }
                    }, {
                        order_id: order_id
                    }]
                }
                ]
            }).sort({
                updatedAt: -1
            });

            return msg;
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    send_message: async (req, res) => {
        try {
            const { senderName, recieverId, message, order_id } = req.body;
            const { userId } = req.user;

            let insertMessage = await Messages.create({
                senderId: userId,
                senderName: senderName,
                recieverId: recieverId,
                order_id: order_id,
                message: {
                    text: message,
                    image: ''
                }
            });

            if (insertMessage) {
                
                return res.status(200).json({ success: true, message: "Message sent", data: insertMessage })
            } else {
                return res.status(500).json({ success: false, message: "Internal Server Error", data: [] })
            }

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }

    },

    get_message: async (req, res) => {
        try {
            const { userId } = req.user;
            const { frnId } = req.query;
            const { order_id } = req.body;

            let getAllMessage = await Messages.find({
                $or: [{
                    $and: [{
                        senderId: {
                            $eq: userId
                        }
                    }, {
                        recieverId: {
                            $eq: frnId
                        }
                    }, {
                        order_id: order_id
                    }],
                }, {
                    $and: [{
                        senderId: {
                            $eq: frnId
                        }
                    }, {
                        recieverId: {
                            $eq: userId
                        }
                    }, {
                        order_id: order_id
                    }]
                }]
            });

            return res.status(200).json({ success: true, message: "All Messages", data: getAllMessage })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    image_data: async (req, res) => {
        try {
            const { userId } = req.user;
            const { data } = req.body;

            
            let getLastMessage = await Messages.findOne({
                $or: [{
                    $and: [{
                        senderId: {
                            $eq: userId
                        }
                    }, {
                        recieverId: {
                            $eq: data.recieverId
                        }
                    }],
                }, {
                    $and: [{
                        senderId: {
                            $eq: data.recieverId
                        }
                    }, {
                        recieverId: {
                            $eq: userId
                        }
                    }]
                }]
            }).sort(-1);
            return res.status(200).json({ success: true, message: 'Last message data', data: getLastMessage })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    image_message_send: async (req, res) => {
        try {
            const { userId } = req.user;
            const { senderName, recieverId, order_id } = req.body;
            let chat_image;
            

            if (req.file != undefined) {
                chat_image = `uploads/${req.file.filename}`
                req.file.originalname = chat_image
            }

            // Insert data with Image in chat
            let insertMessage = await Messages.create({
                senderId: userId,
                senderName: senderName,
                recieverId: recieverId,
                order_id: order_id,
                message: {
                    text: '',
                    image: chat_image
                }
            });


            if (insertMessage) {
                return res.status(200).json({ success: true, message: "Image sent", data: insertMessage })
            } else {
                return res.status(500).json({ success: false, message: "Internal Server Error", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    seen_message: async (req, res) => {
        try {
            const { messageId } = req.body;

            let msg = await Messages.findByIdAndUpdate(messageId, {
                status: 'seen'
            })
                .then(() => {
                    return res.status(200).json({ success: true, message: "message seen", data: [] })
                }).catch(() => {
                    return res.status(500).json({ success: false, message: "Internal Server Error", data: [] })
                })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    get_message_socket: async (userId, frnId, order_id) => {

        try {

            let getAllMessage = await Messages.find({
                $or: [{
                    $and: [{
                        senderId: {
                            $eq: userId
                        }
                    }, {
                        recieverId: {
                            $eq: frnId
                        }
                    }, {
                        order_id: order_id
                    }],
                }, {
                    $and: [{
                        senderId: {
                            $eq: frnId
                        }
                    }, {
                        recieverId: {
                            $eq: userId
                        }
                    }, {
                        order_id: order_id
                    }]
                }]
            });

            return getAllMessage
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    send_message_socket: async (senderName, recieverId, message, order_id, userId) => {
        try {

            await Messages.create({
                senderId: userId,
                senderName: senderName,
                recieverId: recieverId,
                order_id: order_id,
                message: { text: message, image: '' }
            });
        } catch (error) {
            console.log("🚀 ~ Error while sending message in socket:", error?.message)
        }

    },

    delivered_message: async (req, res) => {
        try {
            const { messageId } = req.body;

            let msg = await Messages.findByIdAndUpdate(messageId, {
                status: "Delivered"
            })
                .then(() => {
                    return res.status(200).json({ success: true, message: "Message delivered", data: [] })
                }).catch(() => {
                    return res.status(500).json({ success: false, message: "Internal Server Error", data: [] })
                })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    }


}