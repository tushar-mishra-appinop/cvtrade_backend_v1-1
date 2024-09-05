const express = require('express');
const router = express.Router();
const { verifyWithdrawals, withdrawalValidation, inrWithdrawValidation } = require('../validators/WalletValidators');
const { token_verification } = require('../middleware/TokenVerification')
const { upload } = require('../utils/Imageupload')
const WalletController = require('../controllers').WalletController

router
    .post('/v1/wallet/create-wallet',[token_verification], WalletController.create_wallet)

    .get('/v1/wallet/user-wallet', [token_verification], WalletController.get_wallet)

    .get('/v1/wallet/p2p-wallet', [token_verification], WalletController.p2p_wallet)

    .put('/v1/wallet/generate-address', [token_verification], WalletController.generate_address)

    // Estimated Portfolio of a user
    .get('/v1/wallet/estimated-portfolio', [token_verification], WalletController.estimated_portfolio)

    .get('/v1/wallet/verify-deposit',[token_verification], WalletController.verify_deposits)

    // Manual Withdrawal
    .post('/v1/wallet/withdrawal', [token_verification, withdrawalValidation], WalletController.manual_withdrawal)
    //user_cancel withdrawal
    .post('/v1/wallet/user_cancel_withdrawal', [token_verification], WalletController.user_cancel_withdrawal)
    // Withdrawal callback api
    .post('/v1/wallet/verify-withdrawal', [verifyWithdrawals], WalletController.verify_withdrawals)

    // generate withdrawal token
    .get('/v1/wallet/generate-withdrawal-token', WalletController.generate_withdrawal_token)


    .post('/v1/wallet/deposit_inr', [token_verification, upload.single('deposit_slip')], WalletController.deposit_inr )

    // Withdraw INR
    .post('/v1/wallet/withdraw_inr', [token_verification, inrWithdrawValidation], WalletController.withdraw_inr )

    .post('/v1/update_chain', WalletController.update_chain)

    .get('/v1/wallet/all-wallet-zero', WalletController.walletZero)

module.exports = router;