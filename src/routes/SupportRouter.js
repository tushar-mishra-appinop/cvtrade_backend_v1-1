const express = require('express');
const router = express.Router();
const { upload } = require('../utils/Imageupload');
const { token_verification } = require('../middleware/TokenVerification'); 
const SupportController = require('../controllers').SupportController;


router

// User can submit ticket with this api
.post('/v1/support/submit-ticket', [token_verification, upload.single('issue-image')], SupportController.submit_ticket )


// User and admin both can reply to a particular ticket with this api
.post('/v1/support/reply-ticket', SupportController.replyToTicket )


// To fetch all ticket for a user
.get('/v1/support/get-user-tickets', [token_verification], SupportController.getUserTicket)


// to fetch all ticket for admin
.get('/v1/support/get-all-tickets', SupportController.getAllTickets )


.post('/v1/support/update-ticket-status', SupportController.updateTicketStatus)


module.exports = router