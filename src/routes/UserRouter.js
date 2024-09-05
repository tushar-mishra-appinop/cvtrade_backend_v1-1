const express = require("express");
const router = express.Router();
const { upload } = require("../utils/Imageupload");
const UserController = require("../controllers").UserController;
const {
  signupValidation,
  loginValidation,
  verifyOtpValidation,
  otpValidation,
  preferred_quote_currency,
  twoFactorValidation,
  forgotPasswordValidation,
  changePasswordValidation,
  deleteUpiValidation,
} = require("../validators/UserValidators");
const { kycValidation } = require("../validators/KycValidators");
const { token_verification } = require("../middleware/TokenVerification");
// const { cache } = require('../middleware/Redis');

router
  .get("/", async (req, res, next) => {
    return res.status(200).send({ welcome: "Welcome to CV Trade v1" });
  })

  // Registration route
  .post("/v1/user/register", [signupValidation], UserController.signup)

  // Login Route
  .post("/v1/user/login", [loginValidation], UserController.login)

   // Third Party Login
  .post("/user/third-party-login", UserController.thirdPartyLogin)


  // Otp Verify Route
  .post("/v1/user/verify-otp", [verifyOtpValidation], UserController.verify_otp)

  // Send Otp Route
  .post("/v1/user/send-otp", [otpValidation], UserController.send_otp)

  // Get users profile
  .get("/v1/user/profile", [token_verification], UserController.user_profile)

  // Submit Kyc
  .post(
    "/v1/user/submit-kyc",
    [
      token_verification,
      upload.fields([
        { name: "pancard_image" },
        { name: "document_front_image" },
        { name: "document_back_image" },
        { name: "user_selfie" },
      ]),
      kycValidation,
    ],
    UserController.submit_kyc
  )

  // Edit Profile
  .put(
    "/v1/user/edit-profile",
    [token_verification, upload.single("profilepicture")],
    UserController.edit_profile
  )

  // Generate Google QR Code
  .get(
    "/v1/user/generate-google-qr",
    [token_verification],
    UserController.generate_google_qr
  )

  // Update currency prefrence
  .put(
    "/v1/user/currency-preference",
    [token_verification, preferred_quote_currency],
    UserController.currency_prefrence
  )

  // Enable 2FA
  .put(
    "/v1/user/enable-2fa",
    [token_verification, twoFactorValidation],
    UserController.enable_2fa
  )

  .post("/getip", UserController.get_ip)

  // update favorite coin
  .post(
    "/v1/user/favorite-coin",
    [token_verification],
    UserController.update_favorite_coin
  )

  // get favorite list
  .get(
    "/v1/user/favorite-list",
    [token_verification],
    UserController.favorite_list
  )

  // User Refer Codes
  .get(
    "/v1/user/user_refer_code",
    [token_verification],
    UserController.user_refer_code
  )

  // Get Total Referal Count

  // User Referral List
  .get(
    "/v1/user/referral_user_list",
    [token_verification],
    UserController.referral_user_list
  )

  // .post('/v1/user/google-captach', UserController.google_captch)

  .get("/v1/user/get_logs", [token_verification], UserController.get_logs)

  // Reset Password
  .post(
    "/v1/user/forgot_password",
    [forgotPasswordValidation],
    UserController.forgot_password
  )

  .post(
    "/v1/user/change_password",
    [token_verification, changePasswordValidation],
    UserController.change_password
  )

  // Add users bank details
  .post(
    "/v1/user/add-bank-details",
    [token_verification],
    UserController.add_bank_details
  )

  // Edit users bank details
  .post(
    "/v1/user/edit-bank-details",
    [token_verification],
    UserController.edit_bank_details
  )

  // get users bank details
  .post(
    "/v1/user/get-bank-details",
    [token_verification],
    UserController.get_bank_details
  )

  .post(
    "/v1/user/add_user_upi",
    [upload.single("upi_image"), token_verification],
    UserController.user_upi
  )

  // Edit
  .put(
    "/v1/user/edit_user_upi",
    [upload.single("upi_image"), token_verification],
    UserController.edit_upi
  )

  // Delete UPI ID
  .post(
    "/v1/user/delete_upi",
    [deleteUpiValidation],
    UserController.delete_upi_id
  )

  .get(
    "/v1/user/user_upi_details",
    [token_verification],
    UserController.get_upi_details
  )

  // Skip buy sell model
  .post("/v1/user/skip-model", [token_verification], UserController.skip_model)

  .post(
    "/v1/user/partnerships",
    [upload.single("transactionimage")],
    UserController.createPartnership
  )

  .get("/v1/user/getpartnerships", UserController.getPartnership)

  .put("/v1/user/setStatusPartnership", UserController.setStatusPartnership)

  .post('/v1/user/coinListedDetails', UserController.createCoinListedDetails)

  .get('/v1/user/getcoinListedDetails', UserController.getcoinListedDetails)

  .put("/v1/user/setcoindetailstatus", [token_verification], UserController.setcoindetailstatus)

  .get('/v1/user/total_refer_count', [token_verification],UserController.total_refer_count)
  .get('/v1/user/user_referral_list', [token_verification],UserController.referral_user_list)
  .get('/v1/user/referral_balance',[token_verification],UserController.referral_balance)
  .get('/v1/user/joining_balance',[token_verification],UserController.joining_bonus)
  .get('/v1/user/get_latest_news',UserController.news_list)

module.exports = router;
