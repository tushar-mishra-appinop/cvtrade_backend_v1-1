// const Currency = require('../models/Currency');
const Exchange = require('../models/Exchange');
// const Transaction = require('../models/Transaction')
const WalletTransaction = require('../models/WalletTransaction')




module.exports = {

    user_trade_history: async (req, res) => {
        try {
            const { userId } = req.user;
            const { mobile, skip, limit } = req.query;
    
            const totalCount = await Exchange.countDocuments({ user_id: userId });
    
            let aggregationPipeline = [
                { $match: { user_id: userId } },
                { $addFields: { baseObjId: { $toObjectId: "$base_currency_id" } } },
                { $addFields: { quoteObjId: { $toObjectId: "$quote_currency_id" } } },
                {
                    $lookup: {
                        from: 'currencies',
                        localField: 'baseObjId',
                        foreignField: '_id',
                        as: 'base_currency_info'
                    },
                },
                {
                    $unwind: {
                        path: "$base_currency_info",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $lookup: {
                        from: 'currencies',
                        localField: 'quoteObjId',
                        foreignField: '_id',
                        as: 'quote_currency_info'
                    }
                },
                {
                    $unwind: {
                        path: "$quote_currency_info",
                        preserveNullAndEmptyArrays: true
                    }
                },
                {
                    $addFields: {
                        base_currency_name: "$base_currency_info.short_name",
                        quote_currency_name: "$quote_currency_info.short_name"
                    }
                },
                {
                    $project: {
                        id: 1,
                        user_id: 1,
                        order_id: 1,
                        currency: 1,
                        quantity: 1,
                        price: 1,
                        side: 1,
                        order_type: 1,
                        fee: 1,
                        tds: 1,
                        base_currency_id: 1,
                        quote_currency_id: 1,
                        base_currency_name: 1,
                        quote_currency_name: 1,
                        createdAt: 1,
                        updatedAt: 1
                    }
                },
            ];
    
            if (mobile === 'true') {
                // Apply skip and limit if provided
                let skipValue = parseInt(skip) || 0;
                let limitValue = parseInt(limit) || 10;
                aggregationPipeline.push({ $sort: { createdAt: -1 } });
                aggregationPipeline.push({ $skip: skipValue });
                aggregationPipeline.push({ $limit: limitValue });
            } else {
                // Just sort if no mobile query param
                aggregationPipeline.push({ $sort: { createdAt: -1 } });
            }
    
            let orders = await Exchange.aggregate(aggregationPipeline);
    
            return res.status(200).json({
                success: true,
                message: "Trade history fetched successfully",
                data: orders,
                totalCount: totalCount
            });
        } catch (error) {
            // If an error occurs, return an error response
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },
    
    // user_dep_withdrawal_history: async(req, res) => {
    //     try {
    //         const { userId } = req.user;
    //         let list = await WalletTransaction.find({ user_id: userId }).sort({createdAt : -1});
    //         if(list.length > 0) {
    //             return res.status(200).json({success: true, message: 'transaction history fetched', data: list});
    //         } else {
    //             return res.status(200).json({success: true, message: 'transaction history fetched', data: []});
    //         }
    //     } catch (error) {
    //         return res.status(500).json({success: false, message: error.message, data: []})
    //     }
    // },

    user_dep_withdrawal_history: async (req, res) => {
        try {
           
          const { userId } = req.user;
      
          const walletTransaction = await WalletTransaction.aggregate([
            {
              $match: { user_id: userId,
                transaction_type: { $in: ['DEPOSIT', 'WITHDRAWAL', 'CREDIT', 'DEBIT'] } 
            }
            },
            {
              $sort: { createdAt: -1 }
            },
            {
              $lookup: {
                from: "currencies",
                localField: "short_name",
                foreignField: "short_name",
                as: "info"
              }
            },
            {
              $unwind: "$info"
            },
            
            {
              $project: {
                "_id": 1,
                "user_id": 1,
                "currency": 1,
                "icon_path": '$info.icon_path',
                "currency_id": 1,
                "chain": 1,
                "short_name": 1,
                "description": 1,
                "amount": 1,
                "transaction_type": 1,
                "transaction_hash": 1,
                "fee": 1,
                "status": 1,
                "from_address": 1,
                "payment_type": 1,
                "to_address": 1,
                "createdAt": 1,
                "updatedAt": 1,
                "__v": 1
              }
            }
          ]);
      
          if (walletTransaction.length > 0) {
            return res.status(200).json({ success: true, message: 'Transaction history fetched', data: walletTransaction });
          } else {
            return res.status(200).json({ success: true, message: 'No transaction history found', data: [] });
          }
        } catch (error) {
          return res.status(500).json({ success: false, message: error.message, data: [] });
        }
      },
      
    user_deposit_history: async(req, res) => {
        try {
            const { userId } = req.user;
            const { skip, limit } = req.body;
            let list = await WalletTransaction.find({$and: [{ user_id: userId }, {transaction_type: 'DEPOSIT'}]}).sort({createdAt: -1}).skip(skip || 0).limit(limit || 10);
            // await update_activity(req, res, userId);
            if(list.length > 0) {
                return res.status(200).json({success: true, message: 'transaction history fetched', data: list});
            } else {
                return res.status(200).json({success: true, message: 'transaction history fetched', data: []});
            }
        } catch (error) {
            return res.status(500).json({success: false, message: error.message, data: []})
        }
    },

    user_withdrawal_history: async(req, res) => {
        try {
            const { userId } = req.user;
            const { skip, limit } = req.body;
            let list = await WalletTransaction.find({$and: [{ user_id: userId }, {transaction_type: 'WITHDRAWAL'}]}).sort({createdAt: -1}).skip(skip || 0).limit(limit || 10);
            // await update_activity(req, res, userId);
            if(list.length > 0) {
                return res.status(200).json({success: true, message: 'transaction history fetched', data: list});
            } else {
                return res.status(200).json({success: true, message: 'transaction history fetched', data: []});
            }
        } catch (error) {
            return res.status(500).json({success: false, message: error.message, data: []})
        }
    },

    withdrawal_history: async (req, res) => {
        try {
            let withdrawal_history = await WalletTransaction.aggregate([
                {$match: { transaction_type: "WITHDRAWAL", short_name: { $ne: 'INR' } }},
                { $addFields: { userObjId: { $toObjectId: "$user_id" } } },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'userObjId',
                        foreignField: '_id',
                        as: 'logindata'
                    },
                },
                { $unwind: '$logindata' },
                {
                    $addFields: {
                        firstName: '$logindata.firstName',
                        lastName: '$logindata.lastName',
                        emailId: "$logindata.emailId",
                        mobileNumber : "$logindata.mobileNumber"
                    }
                },
                {$project: {'logindata': 0} }
            ])

            return res.status(200).json({ success: true, message: "Withdrawal History Fetched", data: withdrawal_history })

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

   inr_withdrawal_history: async (req, res) => {
        try {
            let withdrawal_history = await WalletTransaction.aggregate([
                {$match: { transaction_type: "WITHDRAWAL", short_name: 'INR'}},
                { $addFields: { userObjId: { $toObjectId: "$user_id" } } },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'userObjId',
                        foreignField: '_id',
                        as: 'logindata'
                    },
                },
                { $unwind: '$logindata' },
                {
                    $addFields: {
                        firstName: '$logindata.firstName',
                        lastName: '$logindata.lastName',
                        emailId: "$logindata.emailId",
                        mobileNumber : "$logindata.mobileNumber"
                    }
                },
                {$project: {'logindata': 0} }
            ])

            return res.status(200).json({ success: true, message: "Withdrawal History Fetched", data: withdrawal_history })

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    deposit_history: async (req, res) => {
        try {
            let withdrawal_history = await WalletTransaction.aggregate([
                {$match: { transaction_type: "DEPOSIT", short_name: { $ne: 'INR' } }},
                { $addFields: { userObjId: { $toObjectId: "$user_id" } } },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'userObjId',
                        foreignField: '_id',
                        as: 'logindata'
                    },
                },
                { $unwind: '$logindata' },
                {
                    $addFields: {
                        firstName: '$logindata.firstName',
                        lastName: '$logindata.lastName',
                        emailId: "$logindata.emailId",
                        mobileNumber : "$logindata.mobileNumber"
                    }
                },
                {$project: {'logindata': 0} }
            ])

            return res.status(200).json({ success: true, message: "Deposit History Fetched", data: withdrawal_history })

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    inr_deposit_history: async (req, res) => {
        try {
            let withdrawal_history = await WalletTransaction.aggregate([
                {$match: { transaction_type: "DEPOSIT", short_name: 'INR' }},
                { $addFields: { userObjId: { $toObjectId: "$user_id" } } },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'userObjId',
                        foreignField: '_id',
                        as: 'logindata'
                    },
                },
                { $unwind: '$logindata' },
                {
                    $addFields: {
                        firstName: '$logindata.firstName',
                        lastName: '$logindata.lastName',
                        emailId: "$logindata.emailId",
                        mobileNumber : "$logindata.mobileNumber"
                    }
                },
                {$project: {'logindata': 0} }
            ])

            return res.status(200).json({ success: true, message: "Deposit History Fetched", data: withdrawal_history })

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

}