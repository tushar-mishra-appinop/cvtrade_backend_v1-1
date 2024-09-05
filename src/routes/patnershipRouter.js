const express = require('express');
const router = express.Router()
const partnershipController = require('../controllers/partnershipController');
const { partner_verification } = require("../middleware/partnerVerification");
const { upload } = require("../utils/partnershipImageUpload");



router
    // add a signup
    .post('/v1/partnerShip/signUp', upload.single("transactionImage"), partnershipController.signUp)

    // add a login
    .post('/v1/partnerShip/login', partnershipController.login)

    //get user partnershi profile
    .get('/v1/partnerShip/userProfile', [partner_verification], partnershipController.userProfile)

    //update user profile
    .post('/v1/partnerShip/updateProfile', [partner_verification, upload.single('partner-iamge')], partnershipController.updateProfile)

    // calculate maker and taker fee
    // .get('/v1/partnerShip/calculate_maker_and_taker_fee', partnershipController.calculate_overall_maker_and_taker_fee)

    // // calculate withdrawal fee
    // .get('/v1/partnerShip/calculate_overall_withdrawal_fee', partnershipController.calculate_overall_withdrawal_fee)

    // // logic for over all distributed money in partners
    .get('/v1/partnerShip/distribute_payouts', partnershipController.distribute_payouts)

    .get('/v1/partnerShip/calculate_coin_commission', partnershipController.calculateTotalCommission)


module.exports = router;