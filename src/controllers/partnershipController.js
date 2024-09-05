const Bcrypt = require("../utils/Bcrypt");
const { create_wallet_for_partner } = require("./WalletController");
const partnershipLogin = require("../models/partnershipLogin");
const { generate_token } = require("../utils/Jwt");
const Currency = require("../models/Currency");
const AdminCommission = require("../models/Commission")
const WalletTransaction = require("../models/WalletTransaction");
const Wallet = require("../models/Wallets");
const Pairs = require("../models/Pairs");
require("dotenv").config({ path: './src/config/.env' });
const { generateRandomString } = require("../utils/Utils");


module.exports = {

  // Partner signup
  signUp: async (req, res) => {
    try {
      const data = req.body;
      const transactionImage = req.file ? `uploads/${req.file.filename}` : "";
      const PartnershipId = generateRandomString();


      // Check if the user already exists
      const existingUser = await partnershipLogin.findOne({ email: data.email });
      if (existingUser) {
        return res.status(400).json({
          success: false,
          message: "User has already registered as a partner",
          data: []
        });
      }

      // Hash the password
      const hashedPassword = await Bcrypt.passwordEncryption(data.password);

      // Create a new user
      const newUser = await partnershipLogin.create({
        userName: data.userName,
        email: data.email,
        phoneNumber: data.phoneNumber,
        country_code: data.country_code,
        transactionId: data.transactionId,
        transactionImage: transactionImage,
        password: hashedPassword,
        PartnershipId: PartnershipId,
        type: 0
      });

      // Create a JWT token for the new user
      const payload = {
        user_id: newUser._id,
        email: data.email
      };

      const token = await generate_token(payload, process.env.JWT_SECRET, process.env.JWT_EXPIRY_TIME);
      const userDetails = { ...newUser._doc };
      delete userDetails.password;

      const user_id = userDetails._id.toString();
      const find_partner_wallet = await Wallet.findOne({ user_id: user_id });

      if (!find_partner_wallet) {
        await create_wallet_for_partner(user_id);
      }

      return res.status(200).json({
        success: true,
        message: "User has successfully registered as a partner",
        data: userDetails,
        token: token,
        PartnershipID: PartnershipId

      });
    } catch (error) {
      // Log the error for debugging
      console.error("Error during sign up:", error);

      // Send error response
      return res.status(500).json({
        success: false,
        message: "An error occurred during registration",
        data: []
      });
    }
  },

  // Partner login
  login: async (req, res) => {
    try {

      const data = req.body;

      const user = await partnershipLogin.findOne({ email: data.email });

      if (user.status === "INACTIVE") {
        return res
          .status(403)
          .json({
            success: false,
            message: "Your account is inactive. Please contact to admin",
            data: [],
          });
      }

      const loginUserDetails = { ...user._doc };
      delete loginUserDetails.password;

      if (user) {
        const userDetails = {
          user_id: user._id,
          email: data.email,
        };

        const token = await generate_token(
          userDetails,
          process.env.JWT_SECRET,
          process.env.JWT_EXPIRY_TIME
        );

        const passwordMatch = await Bcrypt.passwordComparison(
          data.password,
          user.password
        );
        if (passwordMatch) {
          return res
            .status(200)
            .json({
              success: true,
              message: "User logged in successfully",
              data: loginUserDetails,
              token: token,
            });
        } else {
          return res
            .status(403)
            .json({
              success: false,
              message: "Invalid credentials",
              data: []
            });
        }
      } else {
        return res
          .status(404)
          .json({ success: false, message: "User not found", data: [] });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: error, data: [] });
    }
  },

  // Partner Profile
  userProfile: async (req, res) => {
    try {

      let user_id = req.user.user_id

      const user = await partnershipLogin.findOne({
        _id: user_id,
      });

      if (!user) {
        return res.status(403).json({
          success: false,
          message: "User not found",
          data: []
        });
      }

      const userDetails = { ...user._doc };
      delete userDetails.password;

      return res.status(200).json({
        success: true,
        message: "User data fetch successfully.",
        data: userDetails
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error,
        data: []
      });
    }
  },

  // Update partner profile
  updateProfile: async (req, res) => {
    try {

      const data = req.body;

      let updatePartnerDetail = { ...data };

      if (req.file && req.file.filename) {
        const profilePicture = `partnerProfile/${req.file.filename}`;
        updatePartnerDetail = { ...updatePartnerDetail, profilePicture };
      }


      const updatePartner = await partnershipLogin.findOneAndUpdate(
        { _id: req.user.user_id },
        { $set: updatePartnerDetail },
        { new: true, runValidators: true }
      );
      const updateUserDetails = { ...updatePartner._doc };
      delete updateUserDetails.password;

      if (!updatePartner) {
        return res.status(403).json({
          success: false,
          message: "User not found",
          data: []
        });
      }
      return res.status(200).json({
        success: true,
        message: "User detail updated successfully.",
        data: []
      });
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error,
        data: []
      });

    }
  },

  // Calculate maker and taker fee (Transaction Fee)
  // calculate_overall_maker_and_taker_fee: async (req, res) => {
  //   try {
  //     let currencies = await Currency.find()
  //     let finalData = []

  //     for await (const coins of currencies) {
  //       try {
  //         let calculatedFee = await AdminCommission.aggregate(
  //           [
  //             {
  //               $match: {
  //                 currency_id: coins?.id,
  //               }
  //             },

  //             {
  //               $group: {
  //                 _id: {
  //                   currency_id: "$currency_id",
  //                 },
  //                 total_deducted_fee: {
  //                   $sum: "$fee"
  //                 }
  //               }
  //             },
  //             {
  //               $project: {
  //                 _id: 0,
  //                 currency_id: "$_id.currency_id",
  //                 short_name: "$_id.short_name",
  //                 total_deducted_fee: 1
  //               }
  //             }
  //           ]
  //         )

  //         if (calculatedFee.length > 0) {
  //           finalData.push(...calculatedFee); // Flatten results into finalData
  //         }
  //       } catch (error) {
  //         console.log(error, 'error');

  //         continue
  //       }
  //     }


  //     console.log(finalData, 'finalData');

  //     res.status(200).json(finalData);
  //   } catch (error) {
  //     console.error('Error calculating withdrawal amounts:', error);
  //     res.status(500).json({ message: 'Server Error' });
  //   }
  // },

  // // Calculate withdrawal fee (withdrawal fee)
  // calculate_overall_withdrawal_fee: async (req, res) => {
  //   try {
  //     let currencies = await Currency.find()
  //     let finalData = []

  //     for await (const coins of currencies) {
  //       try {
  //         let calculatedFee = await WalletTransaction.aggregate(
  //           [
  //             {
  //               $match: {
  //                 currency_id: coins?.id,
  //                 transaction_type: "WITHDRAWAL",
  //                 fee: { $gt: 0 }
  //               }
  //             },
  //             {
  //               $addFields: {
  //                 deducted_fee: {
  //                   $multiply: [
  //                     "$amount",
  //                     { $divide: ["$fee", 100] }
  //                   ]
  //                 }
  //               }
  //             },
  //             {
  //               $group: {
  //                 _id: {
  //                   currency_id: "$currency_id",
  //                   short_name: "$short_name"
  //                 },
  //                 total_fee: {
  //                   $sum: "$deducted_fee"
  //                 }
  //               }
  //             },
  //             {
  //               $project: {
  //                 _id: 0,
  //                 currency_id: "$_id.currency_id",
  //                 short_name: "$_id.short_name",
  //                 total_fee: 1
  //               }
  //             }
  //           ]
  //         )

  //         if (calculatedFee.length > 0) {
  //           finalData.push(...calculatedFee); // Flatten results into finalData
  //         }
  //       } catch (error) {
  //         console.log(error, 'error');

  //         continue
  //       }
  //     }


  //     console.log(finalData, 'finalData');

  //     res.status(200).json(finalData);
  //   } catch (error) {
  //     console.error('Error calculating withdrawal amounts:', error);
  //     res.status(500).json({ message: 'Server Error' });
  //   }
  // },

  calculateTotalCommission: async (req, res) => {
    try {
      // Get maker/taker fees and withdrawal fees
      const makerTakerFees = await module.exports.calculateOverallMakerAndTakerFee();
      const withdrawalFees = await module.exports.calculateOverallWithdrawalFee();

      const pairsGlobal = await Pairs.find({ quote_currency: "USDT" });
      let usdTotalFee = 0;

      // Function to convert fees to USDT
      const convertFeesToUSDT = async (fees) => {
        for await (let feeData of fees) {
          let shortName = feeData.currency_id;
          let totalFee = feeData.total_fee || feeData.total_deducted_fee; // Handle both types of fees

          // Find the conversion rate for the currency to USDT
          let pair = pairsGlobal.find((p) => p.base_currency_id === shortName);

          if (pair) {
            let usdValue = totalFee * pair.buy_price;
            usdTotalFee += usdValue;
          } else if (feeData?.short_name === 'USDT') {
            usdTotalFee += totalFee;
          } else {
            console.log(`No conversion rate found for currency: ${shortName}`);
          }

        }
        return usdTotalFee

      };

      // Convert withdrawal fees and maker/taker fees to USDT
      let withdrawalFeesOverall = await convertFeesToUSDT(withdrawalFees);
      let makertakerOverall = await convertFeesToUSDT(makerTakerFees);

      res.status(200).json({
        success: true,
        message: "Total commission",
        data: usdTotalFee,
        withdrawalFeesOverall: withdrawalFeesOverall,
        makertakerOverall: makertakerOverall

      });
    } catch (error) {
      console.error('Error calculating total commission:', error);
      res.status(500).json({ message: 'Server Error' });
    }
  },

  calculateOverallMakerAndTakerFee: async () => {
    let finalData = [];
    try {
      let currencies = await Currency.find();
      for await (const coins of currencies) {
        try {
          let calculatedFee = await AdminCommission.aggregate([
            {
              $match: {
                currency_id: coins?.id,
              },
            },
            {
              $group: {
                _id: {
                  currency_id: "$currency_id",
                },
                total_deducted_fee: {
                  $sum: "$fee",
                },
              },
            },
            {
              $project: {
                _id: 0,
                currency_id: "$_id.currency_id",
                short_name: "$_id.short_name",
                total_deducted_fee: 1,
              },
            },
          ]);

          if (calculatedFee.length > 0) {
            finalData.push(...calculatedFee); // Flatten results into finalData
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      console.error('Error calculating maker and taker fees:', error);
    }
    return finalData;
  },

  // Define function to calculate overall withdrawal fees
  calculateOverallWithdrawalFee: async () => {
    let finalData = [];
    try {
      let currencies = await Currency.find();
      for await (const coins of currencies) {
        try {
          let calculatedFee = await WalletTransaction.aggregate([
            {
              $match: {
                currency_id: coins?.id,
                transaction_type: "WITHDRAWAL",
                fee: { $gt: 0 },
              },
            },
            {
              $addFields: {
                deducted_fee: {
                  $multiply: ["$amount", { $divide: ["$fee", 100] }],
                },
              },
            },
            {
              $group: {
                _id: {
                  currency_id: "$currency_id",
                  short_name: "$short_name",
                },
                total_fee: {
                  $sum: "$deducted_fee",
                },
              },
            },
            {
              $project: {
                _id: 0,
                currency_id: "$_id.currency_id",
                short_name: "$_id.short_name",
                total_fee: 1,
              },
            },
          ]);

          if (calculatedFee.length > 0) {
            finalData.push(...calculatedFee); // Flatten results into finalData
          }
        } catch (error) {
          continue;
        }
      }
    } catch (error) {
      console.error('Error calculating withdrawal fees:', error);
    }
    return finalData;
  },

  // Utility function to calculate the total commission and return the same response structure as the API
  calculateTotalCommission2: async () => {
    try {
      // Get maker/taker fees and withdrawal fees
      const makerTakerFees = await module.exports.calculateOverallMakerAndTakerFee();
      const withdrawalFees = await module.exports.calculateOverallWithdrawalFee();

      const pairsGlobal = await Pairs.find({ quote_currency: "USDT" });
      let usdTotalFee = 0;

      // Function to convert fees to USDT
      const convertFeesToUSDT = async (fees) => {
        for await (let feeData of fees) {
          let shortName = feeData.currency_id;
          let totalFee = feeData.total_fee || feeData.total_deducted_fee; // Handle both types of fees

          // Find the conversion rate for the currency to USDT
          let pair = pairsGlobal.find((p) => p.base_currency_id === shortName);

          if (pair) {
            let usdValue = totalFee * pair.buy_price;
            usdTotalFee += usdValue;
          } else if (feeData?.short_name === 'USDT') {
            usdTotalFee += totalFee;
          } else {
            console.log(`No conversion rate found for currency: ${shortName}`);
          }
        }
        return usdTotalFee;
      };

      // Convert withdrawal fees and maker/taker fees to USDT
      let withdrawalFeesOverall = await convertFeesToUSDT(withdrawalFees);
      let makertakerOverall = await convertFeesToUSDT(makerTakerFees);

      return {
        success: true,
        message: "Total commission",
        data: usdTotalFee,
        withdrawalFeesOverall: withdrawalFeesOverall,
        makertakerOverall: makertakerOverall
      };
    } catch (error) {
      console.error('Error calculating total commission:', error);
      return {
        success: false,
        message: 'Server Error',
        data: []
      };
    }
  },
  distribute_payouts: async (req, res) => {
    const withdrawalFees = await module.exports.calculateTotalCommission2();
    let total_amount = withdrawalFees.withdrawalFeesOverall + withdrawalFees.makertakerOverall


    // try {
    //   // Step 1: Retrieve all withdrawal transactions
    //   const transactions = await WalletTransaction.find({ transaction_type: 'WITHDRAWAL' });

    //   if (!transactions.length) {
    //     return res.status(404).json({ message: 'No withdrawal transactions found' });
    //   }

    //   // Step 2: Aggregate data by currency
    //   const currencyMap = {};
    //   const feeMap = { total_maker_fee: 0, total_taker_fee: 0 };

    //   transactions.forEach(transaction => {
    //     const currencyId = transaction.currency_id.toString();
    //     const amount = transaction.amount;
    //     const fee = transaction.fee || 1; // Avoid division by zero, default to 1 if no fee is specified

    //     if (!currencyMap[currencyId]) {
    //       currencyMap[currencyId] = {
    //         total_withdrawal_amount: 0,
    //         total_fee: 0,
    //       };
    //     }

    //     currencyMap[currencyId].total_withdrawal_amount += amount;
    //     currencyMap[currencyId].total_fee += fee;
    //   });

    //   // Retrieve currency details and calculate total maker and taker fees
    //   const currencies = await Currency.find({ _id: { $in: Object.keys(currencyMap) } });

    //   currencies.forEach(currency => {
    //     const data = currencyMap[currency._id.toString()];
    //     if (data) {
    //       feeMap.total_maker_fee += data.total_withdrawal_amount / (currency.maker_fee || 1);
    //       feeMap.total_taker_fee += data.total_withdrawal_amount / (currency.taker_fee || 1);
    //     }
    //   });

    //   // Step 3: Calculate total payout amount
    //   const total_withdrawal_amount = Object.values(currencyMap).reduce((sum, data) => sum + data.total_withdrawal_amount, 0);
    //   const total_amount = 0.49 * (feeMap.total_maker_fee + feeMap.total_taker_fee + total_withdrawal_amount);

    //   // Step 4: Calculate per-user payout
    //   const users = await partnershipLogin.find({});
    //   const num_users = users.length;
    //   if (num_users === 0) {
    //     return res.status(404).json({ message: 'No users found' });
    //   }

    //   const monthly_payout = total_amount / (20 * num_users); // Total payout divided by 20 months and number of users

    //   // Prepare payout distribution
    //   const payouts = users.map(user => ({
    //     user_id: user._id,
    //     payout_per_month: monthly_payout,
    //     total_payout: 20 * monthly_payout
    //   }));

    //   res.status(200).json({ total_amount, payouts });
    // } catch (error) {
    //   console.error('Error distributing payouts:', error);
    //   res.status(500).json({ message: 'Server Error' });
    // }
  },

};
