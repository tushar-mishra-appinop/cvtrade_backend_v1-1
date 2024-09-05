const router = require('express').Router();
const { token_verification } = require('../middleware/TokenVerification');
const MessengerController = require('../controllers').MessengerController;
const { upload } = require('../utils/Imageupload');


router

    // GET My Friends
    .post('/v1/messenger/get-friends', [token_verification], MessengerController.get_friends )

    // Send Message
    .post('/v1/messenger/send_message', [token_verification], MessengerController.send_message)

    .post('/v1/messenger/get-message/:id', [token_verification], MessengerController.get_message)

    .post('/v1/messenger/image_message_send', [token_verification, upload.single('chat_image')], MessengerController.image_message_send )

    .post('/v1/messenger/image_data', [token_verification], MessengerController.image_data)

    .post('/v1/messenger/seen_message', [token_verification], MessengerController.seen_message)

    .post('/v1/messenger/delivered_message', [token_verification], MessengerController.delivered_message )

    
module.exports = router;