const express = require('express');
const router = express.Router();
const { token_verification } = require('../middleware/TokenVerification')
const { placeOrderValidation, historicalChartValidation } = require('../validators/ExchangeValidator')
const ExchangeController = require('../controllers').ExchangeController
const CurrencyController = require('../controllers').CurrencyController


router
    .post('/v1/exchange/place-order', [token_verification, placeOrderValidation], ExchangeController.place_order)

    .post('/v1/exchange/orderbook', ExchangeController.get_orderbook)

    .get('/v1/exchange/sell-orderbook', ExchangeController.get_sell_orderbook)

    .get('/v1/exchange/buy-orderbook', ExchangeController.get_buy_orderbook)

    // Chart Historical Data
    .post('/v1/exchange/historical-data', [historicalChartValidation],ExchangeController.historical_data)

    // Past Order Api
    .post('/v1/exchange/past-order', [token_verification],ExchangeController.get_executed_orders)
   
    // All Pending Order Api
    .get('/v1/exchange/all-open-orders', [token_verification],ExchangeController.get_all_open_orders)

    .get('/v1/admin/all-open-orders',ExchangeController.get_all_open_orders_admin)

    .delete('/v1/admin/delete-all-open-orders',ExchangeController.delete_all_open_orders_admin)

    .delete('/v1/admin/delete-single-open-order/:id', ExchangeController.delete_single_open_order_admin)
    

    // Cancel Order
    .post('/v1/exchange/cancel-order', [token_verification],ExchangeController.cancel_order)
    .post('/v1/exchange/cancel_all_order', [token_verification],ExchangeController.cancelAllOrders)
    // Fees of a currency
    .post('/v1/exchange/coin-details', CurrencyController.get_currency_details)

    .post('/v1/exchange/find-trades-by-orderid', ExchangeController.find_trades_by_order_id)

    // get all negative orders
    .get('/v1/exchange/negative-orders', ExchangeController.get_negative_orders)

    // User trade history
    .post('/v1/exchange/user-trade-history', [token_verification], ExchangeController.get_user_trade_history)


module.exports = router;