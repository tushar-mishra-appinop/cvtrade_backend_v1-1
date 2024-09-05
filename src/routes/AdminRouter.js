const express = require('express');
const router = express.Router()
const AdminController = require('../controllers').AdminController
const { upload } = require('../utils/Imageupload');
const { adminValidator,
  adminLoginValidation,
  coinCategoryValidation,
  editSubadminValidation,
  deleteSubamdinValidation,
  updateStatusValidation,
  notificationValidation,
  deleteNotificationValidation,
  addBankDetailsValidation,
  selectCoinValidation,
  debitCreditValidation,
  TransactionValidation,
  p2pCurrencyValidation } = require('../validators/AdminValidators');


router

  // Admin Login
  .post('/v1/admin/login', [adminLoginValidation], AdminController.login)

  // add a new admin
  .post('/v1/admin/add-new-admin', [adminValidator], AdminController.add_new_admin)

  // subadmin list
  .get('/v1/admin/sub-admin-list', AdminController.sub_admin_list)

  // Fetch all user list
  .get('/v1/admin/user-list', AdminController.user_list)

  // Fetch total user on system,
  .get('/v1/admin/user-count', AdminController.user_count)

  // find total users with kyc pending
  .get('/v1/admin/pending-kyc-count', AdminController.pending_kyc_count)

  // find total users with approved kyc
  .get('/v1/admin/approved-kyc-count', AdminController.approved_kyc_count)

  // Find users kyc details with userId
  .post('/v1/admin/kyc-details', AdminController.kyc_details)

  // Update Kyc of a user with userId
  .put('/v1/admin/update-kyc-status', AdminController.update_kyc_status)

  // Find Pending Kyc list
  .get('/v1/admin/pending-kyc-user', AdminController.pending_kyc_user)

  // Find Approved Kyc list
  .get('/v1/admin/approve-kyc-user', AdminController.approve_kyc_user)

  // Find Rejected Kyc list
  .get('/v1/admin/rejected-kyc-user', AdminController.rejected_kyc_user)

  //  Create a coins category
  .post('/v1/admin/create-coin-category', [coinCategoryValidation], AdminController.create_coin_category)

  // Fetch Coin Category list
  .get('/v1/admin/coin-category-list', AdminController.get_coin_category_list)

  // Today's New Registration
  .get('/v1/admin/today_new_registration', AdminController.today_new_registration)

  // Edit Subadmin
  .put('/v1/admin/edit_subadmin', [editSubadminValidation], AdminController.edit_subadmin_details)

  // Delete Subadmin
  .post('/v1/admin/delete_subadmin', [deleteSubamdinValidation], AdminController.delete_subadmin)

  // Update status
  .put('/v1/admin/update_status', [updateStatusValidation], AdminController.update_status)

  // Add Notification
  .post('/v1/admin/add_notification', [notificationValidation], AdminController.add_notification)

  // Notification List
  .get('/v1/admin/notification-list', AdminController.notification_list)

  // Delete Notification
  .post('/v1/admin/delete-notification', [deleteNotificationValidation], AdminController.delete_notification)

  // Admin Add Bank Details
  .put('/v1/admin/add_bank_details', [addBankDetailsValidation], AdminController.admin_bank_details)

  // Edit Admin Bank Details
  .post('/v1/admin/edit_admin_bank_details', AdminController.edit_bank_details)

  // Get Admin Bank Details
  .get('/v1/admin/get_user_bank_details', AdminController.get_bank_details)

  // Select Coin for debit/ credit functionality
  .post('/v1/admin/select_given_coin', [selectCoinValidation], AdminController.select_given_coin)

  // Debit or Credit functionality
  .post('/v1/admin/debit_credit', [debitCreditValidation], AdminController.debit_credit)

  // Get Debit Credit Transaction
  .get('/v1/admin/debit_credit_transaction', [TransactionValidation], AdminController.get_debit_credit_transaction)

  // Pending Deposit Request
  .get('/v1/admin/pending_deposit_request', AdminController.pending_deposit_request)

  // Complete Deposit Request
  .get('/v1/admin/complete_deposit_request', AdminController.complete_deposit_request)

  // Pending Withdrawal Request
  .get('/v1/admin/pending_withdrawal_request', AdminController.pending_withdraw_request)

  // Complete Withdrawal Request
  .get('/v1/admin/complete_withdrawal_request', AdminController.complete_withdraw_request)

  // Cancelled Withdrawal Request
  .get('/v1/admin/reject_withdrawal_request', AdminController.cancelled_withdraw_request)

  // Miscellaneous  Withdrawal Request
  .get('/v1/admin/miscellaneous_withdrawal_request', AdminController.miscellaneous_withdraw_request)

  // Approve or Cancel DEPOSIT
  .post('/v1/admin/update_deposit_status', [updateStatusValidation], AdminController.update_deposit_status)

  // Approve or Cancel Withdrawal
  .post('/v1/admin/update_withdrawal_status', updateStatusValidation, AdminController.update_withdrawal_status)

  // Get Admins Trading commission
  .post('/v1/admin/trading-commission', AdminController.get_admin_commission)

  // get users bank details
  .post('/v1/admin/get-bank-details', AdminController.get_user_bank_details)

  // Edit Admin Status
  .put('/v1/admin/admin_status', [updateStatusValidation], AdminController.admin_status)

  // Users trade history for admin panel
  .post('/v1/admin/user-trade-history', AdminController.get_users_trade_history)

  // Complete All Users trade history for admin panel
  .post('/v1/admin/trade-history', AdminController.get_trade_history)

  // Get users balance
  .post('/v1/admin/user-wallet', AdminController.get_user_wallet)

  .put('/v1/admin/add_admin_upi', [upload.single('upi_image')], AdminController.admin_upi)

  // Get Admin Bank Details
  .get('/v1/admin/admin_upi_details', AdminController.get_upi_details)

  .get('/v1/admin/withdrawal_fees', AdminController.withdrawal_fees)

  .post('/v1/admin/p2p_currencies', [p2pCurrencyValidation], AdminController.p2p_currencies)

  .post('/v1/admin/remove_p2p_currency', [p2pCurrencyValidation], AdminController.remove_currency)

  //  Maintenance api
  .post('/v1/admin/change-maintenance', AdminController.update_maintenance)

  //  Maintenance api
  .get('/v1/admin/get-maintenance', AdminController.get_maintenance)

  // Edit Admin Bank Details
  .post('/v1/admin/edit_admin_bank_details', AdminController.edit_bank_details)

  // Find Pending Bank details of user
  .get('/v1/admin/pending-bank-details', AdminController.pending_bank_details)

  .get('/v1/admin/approve-bank-details', AdminController.approve_bank_details)

  .get('/v1/admin/reject-bank-details', AdminController.reject_bank_details)

  // Verify users bank details
  .put('/v1/admin/verify-bank-details', AdminController.verify_users_bank_details)

  // Find Pending Bank details of user
  .get('/v1/admin/pending-upi-details', AdminController.pending_upi_details)

  .get('/v1/admin/approve-upi-details', AdminController.approve_upi_details)

  .get('/v1/admin/reject-upi-details', AdminController.reject_upi_details)

  // Verify users upi details
  .put('/v1/admin/verify-upi-details', AdminController.verify_users_upi_details)

  // User Backup API
  .get('/v1/admin/all-user-wallet-backup', AdminController.all_user_wallet_backup)

  // Partner status active or inactive for login
  .post('/v1/admin/update-partner-status', AdminController.partner_user_active_inactive)

  // Create partner by admin
  .post('/v1/admin/create-partner-by-admin', AdminController.create_partner_by_admin)

  // Edit partner by admin
  .post('/v1/admin/edit-partner-by-admin', upload.single('profilePicture'), AdminController.edit_partner_by_admin)

  // Partner Profile API
  .get('/v1/admin/view-partner-profile/:id', AdminController.view_partner_profile)

  // Partner Profile delete
  .delete('/v1/admin/delete-partner-profile/:id', AdminController.delete_partner)

  // 
  .get('/v1/admin/get-total-deposit-per-day', AdminController.getTodaysTotalDeposit)



module.exports = router