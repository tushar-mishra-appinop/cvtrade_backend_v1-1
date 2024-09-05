const express = require('express');
const router = express.Router()
const { icon_upload } = require('../utils/Imageupload')
const CurrencyController = require('../controllers').CurrencyController
const { addCoinValidation, addPairValidation } = require('../validators/CurrencyValidators');

router
    // Add a new coin
    .post('/v1/coin/add-coin', [icon_upload.single('coin-image'), addCoinValidation],CurrencyController.add_coin)

    // Fetch All Coins List
    .get('/v1/coin/get-coin', CurrencyController.get_all_coins)

    // Create a pair
    .post('/v1/coin/add-pairs',[addPairValidation], CurrencyController.create_pairs)

    // Fetch all pair list
    .get('/v1/coin/get-pairs', CurrencyController.get_all_pairs)

    // Edit Currency
    .put('/v1/coin/edit-currency', [icon_upload.single('coin-image')],CurrencyController.edit_currency)

    .get('/v1/coin/p2p_coin_list', CurrencyController.p2p_list)

    // Delete Pair
    .post('/v1/coin/delete-pair', CurrencyController.delete_pair)

    // Start or stop bot
    .post('/v1/coin/bot-status', CurrencyController.bot_status)
    
    .get('/v1/coin/get_top_GL', CurrencyController.get_top_gl)
    .get('/v1/coin/get_trending', CurrencyController.get_top_tr)
module.exports = router; 