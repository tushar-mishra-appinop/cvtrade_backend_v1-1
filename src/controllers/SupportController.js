const support = require('../models/Support');


module.exports = {
    submit_ticket : async (req, res) => {
        try {
            let { userId } = req.user;
            let { emailId, subject, description, order_id } = req.body;
            let issueImage;

            if(req.file != undefined) {
                issueImage = `uploads/${req.file.filename}`
            }

            let obj = {
                userId: userId,
                emailId: emailId,
                subject: subject,
                description: description,
                issueImage: issueImage,
                order_id: order_id
            }
            

            let data = await support.create(obj)

            if(data) {
                return res.status(200).json({success: true, message: "Ticket Submitted Successfully", data: data})
            } else {
                return res.status(500).json({success: false, message: "Some error occured", data: []})
            }
        } catch (error) {
            return res.status(500).json({success: false, message: error.message, data: []})
        }
    },

    replyToTicket : async (req, res) => {
        try {
            const { ticket_id, query, replyBy } = req.body; 

            let obj = {
                query: query,
                replyBy: replyBy
            }

            let data = await support.updateOne(
                {_id: ticket_id},
                {
                    $push: {
                        ticket: obj
                    },
                    $set: {
                        seen: replyBy
                    }
                }
            );

            if(data) {
                return res.status(200).json({success: true, message: "Response submitted", data: data})
            } else {
                return res.status(500).json({success: false, message: "Some error occured", data: []})
            }
        } catch (error) {
            return res.status(500).json({success: false, message: error.message, data: []})
        }
    },

    getUserTicket : async (req, res) => {
        try {
            const { userId } = req.user;

            let data = await support.find({userId: userId})

            if(data) {
                return res.status(200).json({success: true, message: "Tickets list fetched", data: data})
            } else {
                return res.status(500).json({success: false, message: "Some error occured", data: []})
            }

        } catch (error) {
            return res.status(500).json({success: false, message: error.message, data: []})
        }
    },

    getAllTickets : async (req, res) => {
        try {
            let data = await support.find()

            if(data) {
                return res.status(200).json({success: true, message: "All tickets fetched successfully", data: data})
            } else {
                return res.status(500).json({success: false, message: "Some error occured", data: []})
            }
            
        } catch (error) {
            return res.status(500).json({success: false, message: error.message, data: []})
        }
    },

    updateTicketStatus: async (req, res) => {
        try {
            const { ticket_id, status } = req.body;

            let data = await support.updateOne(
                {_id: ticket_id},
                {
                    $set: {
                        status: status
                    }
                }
            )
            if(data.modifiedCount > 0) {
                return res.status(200).json({success: true, message: "Ticket status updated", data: data});
            } else {
                return res.status(500).json({success: false, message: "Some error occured", data: []})
            }
        } catch (error) {
            return res.status(500).json({success: false, message: error.message, data: []})
        }
    }
}