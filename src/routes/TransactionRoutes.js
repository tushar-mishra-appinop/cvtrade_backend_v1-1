const express = require('express');
const router = express.Router()
const { token_verification } = require('../middleware/TokenVerification')
const TransactionController = require('../controllers').TransactionController

router
    .get('/v1/transaction/trade-history', [token_verification], TransactionController.user_trade_history)

    .get('/v1/transaction/wallet-history', [token_verification], TransactionController.user_dep_withdrawal_history)

    .post('/v1/transaction/wallet-deposit-history', [token_verification], TransactionController.user_deposit_history)

    .post('/v1/transaction/wallet-withdrawal-history', [token_verification], TransactionController.user_withdrawal_history)

    // Withdrawal History
    .get('/v1/transaction/get_withdrawal_history', TransactionController.withdrawal_history)

    .get('/v1/transaction/get_deposit_history', TransactionController.deposit_history)

    // INR Withdrawal History
    .get('/v1/transaction/get_inr_withdrawal_history', TransactionController.inr_withdrawal_history)

    .get('/v1/transaction/get_inr_deposit_history', TransactionController.inr_deposit_history)




module.exports = router;