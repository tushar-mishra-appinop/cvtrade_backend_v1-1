const express = require('express');
const router = express.Router()
const { token_verification } = require('../middleware/TokenVerification');
const { postValidation, orderDetailsValidations } = require('../validators/P2PValidators');
const P2PController = require('../controllers/P2PController');

router

    .post('/v1/p2p/buy_currency', [token_verification], P2PController.buy_currency)

    .post('/v1/p2p/buy_request', P2PController.buy_request)

    .post('/v1/p2p/runtime_api', P2PController.runtime_api )

    .post('/v1/p2p/check_balance', [token_verification], P2PController.check_balance)

    .post('/v1/p2p/check_trades', [token_verification], P2PController.check_trades)

    .post('/v1/p2p/check_kyc', [token_verification], P2PController.check_kyc )

    .post('/v1/p2p/registered_days', [token_verification], P2PController.registered_days)

    .get('/v1/p2p/my_orders', [token_verification], P2PController.all_my_orders)

    .get('/v1/p2p/completed_order', [token_verification], P2PController.completed_order)

    .get('/v1/p2p/cancelled_order', [token_verification], P2PController.cancelled_order)

    .post('/v1/p2p/create_new_post', [token_verification, postValidation], P2PController.create_post)

    .get('/v1/p2p/fetch_payment_methods', [token_verification], P2PController.payment_method )

    .post('/v1/p2p/delete_payment_method', P2PController.delete_payment_method )

    .get('/v1/p2p/my_ads', [token_verification], P2PController.my_ads)

    .post('/v1/p2p/swapping_history', [token_verification], P2PController.swapping_history)

    // .get('/v1/p2p/recent_post', [token_verification], P2PController.my_recent_post)

    .post('/v1/p2p/sell_order', P2PController.sell_orders)

    .post('/v1/p2p/buy_order', P2PController.buy_order)

    .post('/v1/admin/add_fiat', P2PController.add_fiat)

    .post('/v1/admin/remove_currency', P2PController.remove_currency)

    .get('/v1/p2p/fiat_currency_list', P2PController.fiat_currency_list)

    .post('/v1/p2p/current_price', P2PController.fetch_current_price)

    // Give Ratings to User
    .post('/v1/p2p/rate_user', [token_verification], P2PController.rate_user)

    .get('/v1/p2p/my_ratings', [token_verification], P2PController.my_ratings )

    .post('/v1/p2p/write_review', [token_verification], P2PController.write_review )

    .get('/v1/p2p/my_reviews', [token_verification], P2PController.my_reviews )

    // Transfer Balance or funds from One Funding Wallet to Spot Balance
    .post('/v1/p2p/swaping_wallets', [token_verification], P2PController.swapping_wallets )

    .post('/v1/p2p/admin_payments', P2PController.admin_payments)

    .post('/v1/p2p/remove_payments', P2PController.remove_payments)

    .get('/v1/p2p/payment_type_list', P2PController.payment_type_list)

    .post('/v1/p2p/trader_confirmation', P2PController.trader_confirmation)

    .post('/v1/p2p/merchant_confirmation', P2PController.merchant_confirmation)

    // Dispute API
    .post('/v1/p2p/resolve_dispute', P2PController.resolve_dispute)

    // Admin can fetch all the P2P Orders
    .get('/v1/p2p/all_p2p_orders', P2PController.all_p2p_orders)

    .post('/v1/p2p/notify_trader', P2PController.notify_trader)

    // Order Notification
    .post('/v1/p2p/add_order_notification', [token_verification], P2PController.add_order_notification )

    // Fetch Order's Notification
    .get('/v1/p2p/my_order_notification', [token_verification], P2PController.my_order_notification)

    .post('/v1/p2p/post_status', P2PController.post_status)

    .post('/v1/p2p/order_details',[orderDetailsValidations], P2PController.order_details)

    // Admin Handling Dispute Requests
    .post('/v1/p2p/dispute_handling', P2PController.dispute_handling)

    .post('/v1/p2p/statusToSettle', P2PController.statusToSettle)

    .post('/v1/p2p/request_refund', [token_verification], P2PController.request_refund)

module.exports = router;



