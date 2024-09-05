const express = require('express');
const router = express.Router();
const { token_verification } = require('../middleware/TokenVerification')
const SwappingController =  require('../controllers/SwappingController')
router
    // Quick Buy Sell
    // .post('/v1/swap/convert-token', [token_verification], SwappingController.convert_token)

    // Quick Buy Sell
    .post('/v1/qbs/quick_buy_sell',[token_verification], SwappingController.quick_buy_sell)

    // Quick buy sell history
    .get('/v1/qbs/history',[token_verification], SwappingController.getQuickBuySellTransaction)

module.exports = router;