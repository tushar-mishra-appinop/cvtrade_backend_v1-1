const Users = require('../models/Users');
const Currency = require('../models/Currency')
const Wallets = require('../models/Wallets');
const WalletController = require('./WalletController');
const P2P_transactions = require('../models/P2P_transactions');
const Pairs = require('../models/Pairs');
const P2P_payment = require('../models/P2P_payment');
const Reviews = require('../models/Reviews');
const UserBankDetails = require('../models/UserBankDetails');
const userUpiDetails = require('../models/userUpiDetails');
const PaymentTypes = require('../models/PaymentTypes');
const logs = require('../models/logs');
const OrderNotifications = require('../models/OrderNotifications');
const { email_marketing } = require('../utils/Marketing');
const SwappingHistory = require('../models/SwappingHistory');
const WalletTransaction = require('../models/WalletTransaction');
const crypto = require('crypto');

module.exports = {

    buy_currency: async (req, res) => {
        try {
            const { userId } = req.user;
            const { amount, receiving_amount, postAd_user, add_id, payment_timestamp, payment_method, payment_type } = req.body;

            // Finding the details of the Ad that we selected to buy and sell
            let find_postAd = await P2P_transactions.findOne({
                $and: [
                    { postAd_user: postAd_user },
                    { _id: add_id }
                ]
            })

            let post = await P2P_transactions.findOne({ _id: add_id })

            let user_balance = await Wallets.findOne({
                $and: [
                    { user_id: userId },
                    { short_name: find_postAd.base_short_name }
                ]
            });

            if (!user_balance) {
                return res.status(500).json({ success: false, message: `${find_postAd.base_short_name} is not found in your wallet`, data: [] })
            }


            let buy_request = {};

            buy_request._id = crypto.randomBytes(12).toString('hex');
            buy_request.sponser_user = find_postAd.postAd_user
            buy_request.trader_id = userId
            buy_request.side = find_postAd.side
            buy_request.amount = amount
            buy_request.receiving_amount = receiving_amount
            buy_request.price_type = find_postAd.price_type
            buy_request.min_amount = find_postAd.min_amount
            buy_request.max_amount = find_postAd.max_amount
            buy_request.payment_method = payment_method
            buy_request.payment_timestamp = payment_timestamp
            buy_request.payment_time = find_postAd.payment_time
            buy_request.payment_type = payment_type
            buy_request.remark = find_postAd.remark
            buy_request.status = "IN PROGRESS"
            buy_request.description = find_postAd.description
            buy_request.fee = find_postAd.fee
            buy_request.fixed_price = find_postAd.fixed_price
            buy_request.base_currency = find_postAd.base_currency
            buy_request.base_short_name = find_postAd.base_short_name
            buy_request.quote_currency = find_postAd.quote_currency
            buy_request.quote_short_name = find_postAd.quote_short_name
            buy_request.createdAtInSeconds = Math.floor(Date.now() / 1000);



            let find_base = await Currency.findOne({ short_name: buy_request.base_short_name })

            let currency_base = await Wallets.findOne({
                $and: [
                    { user_id: userId },
                    { short_name: buy_request.base_short_name }
                ]
            })
            let base_balance = currency_base.p2p_balance;

            if (buy_request.side === "BUY") {

                let currency_base = await Wallets.findOne({
                    $and: [
                        { user_id: userId },
                        { short_name: buy_request.base_short_name }
                    ]
                })
                let quote_balance = currency_base.p2p_balance

                if (buy_request.payment_type === 'P2P_Wallet') {

                    if (buy_request.amount > quote_balance) {
                        return res.status(500).json({ success: false, message: `Insufficient P2P Balance in ${buy_request.base_short_name}` })
                    }

                    // BUY ORDER
                    // Deduct from balance
                    let update_wallet = await WalletController.update_p2p_balance(userId, currency_base.currency_id, -buy_request.amount)

                    // Update P2P Balance
                    let p2p_balance = await WalletController.update_p2p_locked(userId, currency_base.currency_id, buy_request.amount)
                    let walletTrans = {
                        user_id: userId,
                        order_id: buy_request._id,
                        currency: buy_request.base_currency,
                        currency_id: find_base.id,
                        chain: " ",
                        short_name: find_base.short_name,
                        description: "P2P Paid",
                        amount: amount,
                    }

                    let data = await WalletTransaction.create(walletTrans)
                }


                // Create a P2P transaction
                let transaction = {};
                transaction.postAd_user = buy_request.sponser_user,
                    transaction.trader_id = userId,
                    transaction.order_id = buy_request._id,
                    transaction.add_id = add_id,
                    transaction.quote_currency = find_postAd.quote_currency,
                    transaction.base_currency = find_base.short_name,
                    transaction.quote_currency_id = find_postAd.quote_currency_id,
                    transaction.base_currency_id = find_base.id,
                    transaction.chain = "BEP20",
                    transaction.fixed_price = buy_request.fixed_price,
                    transaction.floating_price = buy_request.floating_price,
                    transaction.receiving_amount = buy_request.receiving_amount,
                    transaction.quote_short_name = find_postAd.quote_short_name,
                    transaction.base_short_name = find_base.short_name,
                    transaction.description = `P2P trading`,
                    transaction.payment_method = buy_request.payment_method,
                    transaction.payment_timestamp = payment_timestamp,
                    transaction.payment_time = find_postAd.payment_time,
                    transaction.amount = buy_request.amount,
                    transaction.status = "IN PROGRESS",
                    transaction.from_currency = buy_request.base_currency,
                    transaction.to_currency = buy_request.quote_currency,
                    transaction.side = "BUY"

                let submit = await P2P_transactions.create(transaction)

                // Update Order Id in User's Schema
                let updateTrader = await Users.updateOne({ _id: userId }, {
                    $set: {
                        order_id: submit.order_id
                    }
                })


                // Update Order Id in User's Schema
                let updateMerchant = await Users.updateOne({ _id: buy_request.sponser_user }, {
                    $set: {
                        order_id: submit.order_id
                    }
                })

                // Find POST ID and update status to IN Progress
                let find_add = await P2P_transactions.updateOne({ _id: add_id }, {
                    $set: {
                        status: "IN PROGRESS"
                    }
                })
                let seller = await Users.findOne({ _id: buy_request.trader_id })
                let buyer = await Users.findOne({ _id: buy_request.sponser_user })

                await email_marketing("p2pOrderMatch", buy_request, seller?.emailId);
                await email_marketing("p2pOrderMatch", buy_request, buyer?.emailId);

                // Add Logs
                let activity_data = {};
                activity_data.Activity = "P2P Order Placed",
                    activity_data.IP = req.socket.remoteAddress,
                    activity_data.userId = userId,
                    activity_data.date = new Date();
                let add_logs = await logs.create(activity_data)


                return res.status(200).json({ success: true, message: "Order Placed successfully", data: submit })

            } else {
                if (find_postAd.payment_method[0].type != payment_method.type) {
                    return res.status(500).json({ success: false, message: "Please select the given payment method", data: [] })
                }

                if (payment_method.verified != '1') {
                    return res.status(500).json({ success: false, message: "Please get your payment method verified first", data: [] })
                }

                if (buy_request.payment_type === 'P2P_Wallet') {

                    if (buy_request.amount > base_balance) {
                        return res.status(500).json({ success: false, message: `Insufficient Balance in ${buy_request.base_short_name}` })
                    }

                    // BUY ORDER
                    // Deduct from balance
                    let update_wallet = await WalletController.update_p2p_balance(userId, currency_base.currency_id, -buy_request.receiving_amount)

                    // Update P2P Balance
                    let p2p_balance = await WalletController.update_p2p_locked(userId, currency_base.currency_id, buy_request.receiving_amount)
                }

                // Create a P2P transaction
                let transaction = {};
                transaction.postAd_user = buy_request.sponser_user,
                    transaction.trader_id = userId,
                    transaction.order_id = buy_request._id,
                    transaction.add_id = add_id,
                    transaction.quote_currency = find_postAd.quote_currency,
                    transaction.base_currency = find_base.short_name,
                    transaction.quote_currency_id = find_postAd.quote_currency_id,
                    transaction.base_currency_id = find_base.id,
                    transaction.chain = "BEP20",
                    transaction.fixed_price = buy_request.fixed_price,
                    transaction.floating_price = buy_request.floating_price,
                    transaction.receiving_amount = buy_request.receiving_amount,
                    transaction.quote_short_name = find_postAd.quote_short_name,
                    transaction.base_short_name = find_base.short_name,
                    transaction.description = `P2P trading`,
                    transaction.payment_method = buy_request.payment_method,
                    transaction.payment_timestamp = payment_timestamp,
                    transaction.payment_time = find_postAd.payment_time,
                    transaction.amount = amount,
                    transaction.status = "IN PROGRESS",
                    transaction.from_currency = buy_request.base_currency,
                    transaction.to_currency = buy_request.quote_currency,
                    transaction.side = "SELL"


                let submit = await P2P_transactions.create(transaction)
                let arr = [];
                let obj = {};

                obj.order_id = buy_request._id

                arr.push(obj)
                // Update Order Id in User's Schema
                let updateTrader = await Users.updateOne({ _id: userId }, {
                    $push: {
                        order_id: obj
                    }
                })

                // Update Order Id in User's Schema
                let updateMerchant = await Users.updateOne({ _id: buy_request.sponser_user }, {
                    $push: {
                        order_id: obj
                    }
                })

                // Check if the Max amount in Post is fullfilled or not 
                // If not then deduct amount and update the max condition with the remaining amount

                // Find POST ID and update status to IN Progress
                let find_add = await P2P_transactions.updateOne({ _id: add_id }, {
                    $set: {
                        status: "IN PROGRESS"
                    }
                })

                let seller = await Users.findOne({ _id: buy_request.trader_id })
                let buyer = await Users.findOne({ _id: buy_request.sponser_user })


                await email_marketing("p2pOrderMatch", buy_request, seller?.emailId);
                await email_marketing("p2pOrderMatch", buy_request, buyer?.emailId);

                // Add Logs
                let activity_data = {};
                activity_data.Activity = "P2P Order Placed",
                    activity_data.IP = req.socket.remoteAddress,
                    activity_data.userId = userId,
                    activity_data.date = new Date();
                let add_logs = await logs.create(activity_data)

                return res.status(200).json({ success: true, message: "Order Placed successfully", data: submit })

            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    buy_request: async (req, res) => {
        try {
            const { order_id } = req.body;

            // Find User's Order Request
            let user_data = await P2P_transactions.findOne({
                order_id: order_id
            })


            // // FIND POST
            let find_post = await P2P_transactions.findOne({ _id: user_data.add_id })


            let obj = {
                OrderData: user_data,
                PostData: find_post
            }


            return res.status(200).json({ success: true, message: "Buy Request fetched", data: obj })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    runtime_api: async (req, res) => {
        try {
            const { status, order_id } = req.body;

            let find_order = await P2P_transactions.findOne({ order_id: order_id })

            if (find_order?.refundedToSeller === true) {
                return res.status(200).json({ success: false, message: "Order is cancelled. Raise a ticket for any concern about this order", data: [] })
            }

            let find_add = await P2P_transactions.findOne({ _id: find_order.add_id })


            let merchant = await Users.findOne({ _id: find_order.postAd_user })
            let trader = await Users.findOne({ _id: find_order.trader_id })

            let data = await P2P_transactions.updateOne({ order_id: order_id }, {
                $set: {
                    status: status
                }
            });


            if (status === 'CANCELLED') {

                // update POST data
                let post = await P2P_transactions.updateOne({ _id: find_add._id }, {
                    $set: {
                        status: 'PENDING'
                    }
                });
            } else if (status != 'CANCELLED') {
                // update POST data
                let post = await P2P_transactions.updateOne({ _id: find_add._id }, {
                    $set: {
                        status: status
                    }
                });
            }

            if (status === 'CONFIRMED') {
                // update P2P Trades for both user's
                let trades = merchant.p2p_trades + 1;
                let trades2 = trader.p2p_trades + 1;
                // Update Total Order's 
                let updateMerchantOrder = await Users.updateOne({ _id: merchant._id }, {
                    $set: {
                        p2p_trades: trades
                    }
                })

                let updateTraderOrder = await Users.updateOne({ _id: trader._id }, {
                    $set: {
                        p2p_trades: trades2
                    }
                })

            }

            if (data) {
                return res.status(200).json({ success: true, message: `Order status updated to ${status}`, data: data })
            } else {
                return res.status(500).json({ success: false, message: "Status not udpated", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    check_balance: async (req, res) => {
        try {
            const { userId } = req.user;
            const { short_name } = req.body;

            let data = await Wallets.findOne({
                $and: [{
                    short_name: short_name,
                    user_id: userId
                }]
            });

            let counterUpdate = await Users.updateOne({ _id: userId }, {
                $set: {
                    counterCurrency: short_name,
                    currencyAmount: data.p2p_balance
                }
            })

            return res.status(200).json({ success: true, message: "Balance checked", data: counterUpdate })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    check_trades: async (req, res) => {
        try {
            const { userId } = req.user;

            let orders = await P2P_transactions.find({
                $and: [
                    { status: 'PENDING' },
                    { description: 'ADD POST' }
                ]
            });

            for (let i = 0; i < orders.length; i++) {
                let user_data = await Users.findOne({ _id: userId });
                if (orders[i].totalTransactions != 0) {

                    if (user_data.p2p_trades === orders[i].totalTransactions) {
                        let updateTrade = await Users.updateOne({ _id: userId }, {
                            $set: {
                                checkTrade: 'Available'
                            }
                        })
                    } else {
                        let updateTrade = await Users.updateOne({ _id: userId }, {
                            $set: {
                                checkTrade: 'Restricted'
                            }
                        })
                    }
                } else {
                    let updateTrade = await Users.updateOne({ _id: userId }, {
                        $set: {
                            checkTrade: 'NO'
                        }
                    })
                }
            }

            return res.status(200).json({ success: true, message: "Check Trades", data: user_data.checkTrade })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    check_kyc: async (req, res) => {
        try {
            const { userId } = req.user;

            let orders = await P2P_transactions.find({
                $and: [
                    { status: 'PENDING' },
                    { description: 'ADD POST' }
                ]
            });

            let data = await Users.findOne({ _id: userId });

            for (let i = 0; i < orders.length; i++) {
                if (orders[i].kyc === true) {
                    if (data.kycVerified != '2') {
                        let updateTrade = await Users.updateOne({ _id: userId }, {
                            $set: {
                                checkKyc: 'Restricted'
                            }
                        })
                    } else {
                        let updateTrade = await Users.updateOne({ _id: userId }, {
                            $set: {
                                checkKyc: 'Available'
                            }
                        })
                    }
                } else if (orders[i].kyc === false) {
                    let updateTrade = await Users.updateOne({ _id: userId }, {
                        $set: {
                            checkKyc: 'NO'
                        }
                    })
                }
            }

            return res.status(200).json({ success: true, message: "Kyc Checked", data: data.checkKyc })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    registered_days: async (req, res) => {
        try {
            const { userId } = req.user;

            let orders = await P2P_transactions.find({
                $and: [
                    { status: 'PENDING' },
                    { description: 'ADD POST' }
                ]
            });

            let find_user = await Users.findOne({ _id: userId })
            for (let i = 0; i < orders.length; i++) {

                if (orders[i].registered_days != 0) {
                    var currentDate = new Date()
                    var lastDate = find_user.createdAt;

                    // Get the various components of the date
                    var year = lastDate.getFullYear();
                    var month = lastDate.getMonth() + 1; // Months are zero-based
                    var day = lastDate.getDate();
                    var hours = lastDate.getHours();
                    var minutes = lastDate.getMinutes();
                    var seconds = lastDate.getSeconds();

                    // Format the date and time
                    var formattedDateTime = year + '-' + padNumber(month) + '-' + padNumber(day) + ' ' +
                        padNumber(hours) + ':' + padNumber(minutes) + ':' + padNumber(seconds);



                    // Get the various components of the date
                    var year = currentDate.getFullYear();
                    var month = currentDate.getMonth() + 1; // Months are zero-based
                    var day = currentDate.getDate();
                    var hours = currentDate.getHours();
                    var minutes = currentDate.getMinutes();
                    var seconds = currentDate.getSeconds();

                    // Format the date and time
                    var formattedDateTime2 = year + '-' + padNumber(month) + '-' + padNumber(day) + ' ' +
                        padNumber(hours) + ':' + padNumber(minutes) + ':' + padNumber(seconds);


                    var date1 = new Date(formattedDateTime);
                    var date2 = new Date(formattedDateTime2);

                    // Calculate the difference in milliseconds
                    var timeDifference = date2 - date1;

                    // Convert the time difference to days
                    var diffDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));




                    // Helper function to pad single-digit numbers with a leading zero
                    function padNumber(num) {
                        return num < 10 ? '0' + num : num;
                    }

                    if (diffDays >= orders[i].registered_days) {
                        let update_days = await Users.updateOne({ _id: userId }, {
                            $set: {
                                dayStatus: "Registered"
                            }
                        }, { upsert: true }
                        );
                    } else if (diffDays < orders[i].registered_days) {
                        let update_days = await Users.updateOne({ _id: userId }, {
                            $set: {
                                dayStatus: "Unregistered"
                            }
                        }, { upsert: true }
                        );
                    }
                } else {
                    let update_days = await Users.updateOne({ _id: userId }, {
                        $set: {
                            dayStatus: "NO"
                        }
                    }, { upsert: true }
                    );
                }

            }

            return res.status(200).json({ success: true, message: "Registered Days", data: find_user.dayStatus })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    all_my_orders: async (req, res) => {
        try {
            const { userId } = req.user;

            let data = await P2P_transactions.find({
                $and: [
                    { postAd_user: userId },
                    { description: "P2P trading" }
                ]
            });

            let data2 = await P2P_transactions.find({
                $and: [
                    { trader_id: userId },
                    { description: "P2P trading" }
                ]
            })

            let obj = {
                PostedOrders: data,
                PurchedOrder: data2
            }

            if (data || data.length > 0) {
                return res.status(200).json({ success: true, message: "All my orders fetched", data: obj })
            } else {
                return res.status(500).json({ success: false, message: 'Some error occured', data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    completed_order: async (req, res) => {
        try {
            const { userId } = req.user;

            let data = await P2P_transactions.find({
                $and: [
                    { user_id: userId },
                    { description: "P2P trading" },
                    { status: "Completed" }
                ]
            });

            if (data || data.length > 0) {
                return res.status(200).json({ success: true, message: "Completed orders fetched", data: data })
            } else {
                return res.status(500).json({ success: false, message: 'Some error occured', data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    cancelled_order: async (req, res) => {
        try {
            const { userId } = req.user;

            let data = await P2P_transactions.find({
                $and: [
                    { user_id: userId },
                    { description: "P2P trading" },
                    { status: "Cancelled" }
                ]
            });

            if (data || data.length > 0) {
                return res.status(200).json({ success: true, message: "Cancelled orders fetched", data: data })
            } else {
                return res.status(500).json({ success: false, message: 'Some error occured', data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    create_post: async (req, res) => {
        try {
            const { userId } = req.user;
            const { base_currency, quote_currency, side, price_type, fixed_price, floating_price, payment_time, volume, payment_method, remark, kyc, registered_days, totalTransactions, counterCurrency, currencyAmount } = req.body;

            let find_user = await Users.findOne({ _id: userId });

            if (find_user.kycVerified != '2') {
                return res.status(500).json({ success: false, message: "Please complete the KYC first.", data: [] })
            }

            // Find if a merchant have atleast 10 successfull trades in the last 30 days

            // let find_trades = await Users.findOne({_id: userId});

            // console.log(find_trades.p2p_trades, ": find user trades count")

            // if(find_trades.p2p_trades < 10) {
            //     return res.status(500).json({success: false, message: "To create a post you must atleast have 10 completed trades", data: []})
            // }

            // Check if a user adds a post of buy or sell 
            // If a user adds a post of sell then check the user's balance

            let find_base = await Currency.findOne({ short_name: base_currency })
            if (!find_base) {
                return res.status(500).json({ success: false, message: `${base_currency} not found`, data: [] })
            }

            let find_quote = await Currency.findOne({ short_name: quote_currency })
            if (!find_quote) {
                return res.status(500).json({ success: false, message: `${quote_currency} not found`, data: [] })
            }

            if (side === 'SELL') {
                let find_balance = await Wallets.findOne({
                    $and: [
                        { user_id: userId },
                        { short_name: base_currency }
                    ]
                })


                if (find_balance.p2p_balance < volume) {
                    return res.status(500).json({ success: false, message: "Insufficient funds in your P2P wallet for creating a post", data: [] })
                }

                // Deduct from balance
                let update_wallet = await WalletController.update_p2p_balance(userId, find_balance.currency_id, -volume)


                // Update P2P Balance
                let p2p_balance = await WalletController.update_p2p_locked(userId, find_balance.currency_id, volume)

            }


            // We are creating post and saving the data
            let obj = {};

            obj.postAd_user = userId,
                obj.post_name = find_user.firstName,
                obj.base_currency = find_base.name,
                obj.base_currency_id = find_base._id,
                obj.quote_currency_id = find_quote._id,
                obj.quote_currency = find_quote.name,
                obj.base_short_name = base_currency,
                obj.quote_short_name = quote_currency,
                obj.side = side,
                obj.price_type = price_type,
                obj.fixed_price = fixed_price,
                obj.floating_price = floating_price,
                obj.payment_timestamp = 0,
                obj.volume = volume,
                obj.payment_method = payment_method,
                obj.payment_time = payment_time,
                obj.kyc = kyc,
                obj.totalTransactions = totalTransactions,
                obj.counterCurrency = counterCurrency,
                obj.currencyAmount = currencyAmount,
                obj.registered_days = registered_days,
                obj.remark = remark,
                obj.successfullOrders = find_user.p2p_trades,
                obj.ratings = find_user.userRatings,
                obj.description = `ADD POST`,
                obj.status = "PENDING"

            let add_post = await P2P_transactions.create(obj);

            // Add Logs
            let activity_data = {};
            activity_data.Activity = "Post Created",
                activity_data.IP = req.socket.remoteAddress,
                activity_data.userId = userId,
                activity_data.date = new Date();
            let add_logs = await logs.create(activity_data)

            return res.status(200).json({ success: true, message: "Post created successfully", data: add_post })

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    add_payment_method: async (req, res) => {
        try {
            const { userId } = req.user;
            const { payment_method } = req.body;

            let obj = {
                user_id: userId,
                payment_method: payment_method
            };

            let add_payment = await P2P_payment.create(obj);

            if (add_payment) {
                return res.status(200).json({ success: true, message: "P2P Payment Methods added", data: add_payment });
            } else {
                return res.status(500).json({ success: false, message: "Some error occurred", data: [] });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },

    payment_method: async (req, res) => {
        try {
            const { userId } = req.user;

            let userBanks = await UserBankDetails.find({ user_id: userId });

            if (userBanks || userBanks.length > 0) {
                console.log("PUSHED BANK's")
            }

            let userupi = await userUpiDetails.find({ user_id: userId });

            if (userupi || userupi.length > 0) {
                console.log("PUSHED UPI's")
            }

            let obj = {
                BankDetails: userBanks,
                UpiDetails: userupi
            }

            return res.status(200).json({
                success: true,
                message: "Payment Methods fetched",
                data: obj
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },

    edit_payment_method: async (req, res) => {
        try {
            const { userId } = req.user;
            const { _id, payment_method } = req.body;

            // Use $elemMatch to find the document with the matching payment method
            // let data = await P2P_payment.findOne({
            //     user_id: userId,
            //     "payment_method": {
            //         $elemMatch: { id: payment_id }
            //     }
            // });
            // console.log(data, ": dataaaaaaaaaaa")
            let data = true

            if (data) {
                // Use the positional $ operator to update the matched payment method
                let edit_data = await P2P_payment.updateOne(
                    { _id: _id },
                    {
                        $set: {
                            payment_method: payment_method
                        }
                    }
                );

                if (edit_data.nModified > 0) {
                    return res.status(200).json({
                        success: true,
                        message: "Payment Method edited",
                        data: edit_data
                    });
                } else {
                    return res.status(500).json({
                        success: false,
                        message: "Payment Method edited",
                        data: []
                    });
                }
            } else {
                return res.status(404).json({
                    success: false,
                    message: "Payment Method not found",
                    data: []
                });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },

    delete_payment_method: async (req, res) => {
        try {
            const { _id } = req.body;
            let data = await P2P_payment.findByIdAndDelete(_id);

            if (data) {
                return res.status(200).json({ success: true, message: "Payment Method deleted", data: data })
            } else {
                return res.status(500).json({ success: false, message: "Some error occured", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },

    my_ads: async (req, res) => {
        try {
            const { userId } = req.user;

            let find_ads = await P2P_transactions.find({ $and: [{ postAd_user: userId }, { description: "ADD POST" }] })

            if (find_ads) {
                return res.status(200).json({ success: true, message: "My Ads list fetched", data: find_ads })
            } else {
                return res.status(500).json({ success: false, message: "No Ads found", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    swapping_history: async (req, res) => {
        try {
            const { userId } = req.user;
            const { skip, limit } = req.body;

            let swapping_history = await SwappingHistory.find({ userId: userId })

            if (swapping_history) {
                return res.status(200).json({ success: true, message: "Swapping History", data: swapping_history })
            } else {
                return res.status(500).json({ success: false, message: "No Swapping history found", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    sell_orders: async (req, res) => {
        try {
            const { short_name } = req.body;

            // Step 1 : Find only the PENDING Orders

            let sell_orders = await P2P_transactions.find({
                $and: [
                    { side: "BUY" },
                    { base_short_name: short_name },
                    { status: 'PENDING' },
                    { description: 'ADD POST' }
                ]
            });



            if (sell_orders || sell_orders.length > 0) {
                return res.status(200).json({ success: true, message: "Sell Orders fetched", data: sell_orders });
            } else {
                return res.status(500).json({ success: false, message: "No Sell orders fetched", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    buy_order: async (req, res) => {
        try {
            const { short_name } = req.body;

            let buy_orders = await P2P_transactions.find({
                $and: [
                    { side: "SELL" },
                    { base_short_name: short_name },
                    { status: 'PENDING' },
                    { description: 'ADD POST' }
                ]
            });


            if (buy_orders || buy_orders.length > 0) {
                return res.status(200).json({ success: true, message: "Buy Orders fetched", data: buy_orders });
            } else {
                return res.status(500).json({ success: false, message: "No Buy orders fetched", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    add_fiat: async (req, res) => {
        try {
            const { currency_short_name, type } = req.body;

            let find_currency = await Currency.findOne({ short_name: currency_short_name })

            if (!find_currency) {
                return res.status(500).json({ success: false, message: "Please add this currency first or enter the correct name" });
            }

            let add_currency;
            if (type === "CRYPTO") {
                add_currency = await Currency.updateOne({ short_name: currency_short_name },
                    {
                        $set: {
                            p2p: true
                        }
                    }
                );

            } else {
                add_currency = await Currency.updateOne({ short_name: currency_short_name },
                    {
                        $set: {
                            p2p_fiat: true
                        }
                    }
                );
            }


            if (add_currency) {
                return res.status(200).json({ success: true, message: "Fiat Currency added to P2P Trading", data: add_currency })
            } else {
                return res.status(500).json({ success: false, message: "Some error occured in adding fiat currency", data: [] })
            }

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    remove_currency: async (req, res) => {
        try {
            const { currency_short_name, type } = req.body;

            let find_currency = await Currency.findOne({ short_name: currency_short_name })

            if (!find_currency) {
                return res.status(500).json({ success: false, message: "Please add this currency first or enter the correct name" });
            }

            let add_currency;
            if (type === "CRYPTO") {
                add_currency = await Currency.updateOne({ short_name: currency_short_name },
                    {
                        $set: {
                            p2p: false
                        }
                    }
                );

            } else {
                add_currency = await Currency.updateOne({ short_name: currency_short_name },
                    {
                        $set: {
                            p2p_fiat: false
                        }
                    }
                );
            }


            if (add_currency) {
                return res.status(200).json({ success: true, message: "Fiat Currency added to P2P Trading", data: add_currency })
            } else {
                return res.status(500).json({ success: false, message: "Some error occured in adding fiat currency", data: [] })
            }

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    fiat_currency_list: async (req, res) => {
        try {
            let find_fiat = await Currency.find({ p2p_fiat: true });

            if (!find_fiat) {
                return res.status(500).json({ success: false, message: "No fiat currency added in P2P", data: [] })
            }

            return res.status(200).json({ success: true, message: "Fiat Currencies fetched", data: find_fiat })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    fetch_current_price: async (req, res) => {
        try {
            const { base_currency, quote_currency } = req.body;
            let currenct_price = await Pairs.findOne({
                $and: [
                    { base_currency: base_currency },
                    { quote_currency: quote_currency }
                ]
            });

            if (!currenct_price) {
                return res.status(500).json({ success: false, message: "No Pair found", data: [] })
            }

            return res.status(200).json({ success: true, message: "Pair fetched successfully", data: currenct_price })

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    rate_user: async (req, res) => {
        try {
            const { userId } = req.user;
            const { ratings } = req.body;

            let data = await Users.updateOne({ _id: userId }, {
                $set: {
                    userRatings: ratings
                }
            },
                { upsert: true }
            );

            if (data) {

                // Add Logs
                let activity_data = {};
                activity_data.Activity = "Given Ratings to user",
                    activity_data.IP = req.socket.remoteAddress,
                    activity_data.userId = userId,
                    activity_data.date = new Date();
                let add_logs = await logs.create(activity_data)

                return res.status(200).json({ success: true, message: "Thank you for your Rating!", data: ratings })
            } else {
                return res.status(500).json({ success: false, message: "Some error occured", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    write_review: async (req, res) => {
        try {
            const { userId } = req.user;
            const { review_id, message } = req.body;

            let obj = {
                userId: review_id,
                reviewGivenBy: userId,
                message: message
            }

            let data = await Reviews.create(obj);

            if (data) {

                // Add Logs
                let activity_data = {};
                activity_data.Activity = "Reviewed a user",
                    activity_data.IP = req.socket.remoteAddress,
                    activity_data.userId = userId,
                    activity_data.date = new Date();
                let add_logs = await logs.create(activity_data)

                return res.status(200).json({ success: true, message: "Review submitted successfully", data: data })
            } else {
                return res.status(500).json({ success: false, message: "Some error occured", data: [] })
            }

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    my_reviews: async (req, res) => {
        try {
            const { userId } = req.user;

            let data = await Reviews.find({ userId: userId });

            if (data) {
                return res.status(200).json({ success: true, message: "My Reviews fetched", data: data })
            } else {
                return res.status(500).json({ success: false, message: "No Reviews found", data: [] })
            }

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    my_ratings: async (req, res) => {
        try {
            const { userId } = req.user;

            let data = await Users.find({ userId: userId });

            if (data) {
                return res.status(200).json({ success: true, message: "My Reviews fetched", data: data.userRatings })
            } else {
                return res.status(500).json({ success: false, message: "No Reviews found", data: [] })
            }

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },


    swapping_wallets: async (req, res) => {
        try {
            const { userId } = req.user;
            const { funding_wallet, amount, short_name } = req.body;

            if (funding_wallet === true) {
                // Step 1 Check if amount available for transfering
                let funds = await Wallets.findOne({
                    $and: [
                        { user_id: userId },
                        { short_name: short_name }
                    ]
                });



                if (amount > funds.balance) {
                    return res.status(500).json({ success: false, message: "Insufficient Balance to transfer", data: [] })
                }

                // Deduct amount from Spot Balance 
                let update_spot = await WalletController.updateBalance(userId, funds.currency_id, -amount)



                // Add to P2P Balance
                let update_funds = await WalletController.update_p2p_balance(userId, funds.currency_id, amount)



                if (update_funds === true && update_spot === true) {

                    // Add Logs
                    let activity_data = {};
                    activity_data.Activity = "Amount added in Spot Wallet",
                        activity_data.IP = req.socket.remoteAddress,
                        activity_data.userId = userId,
                        activity_data.date = new Date();
                    let add_logs = await logs.create(activity_data)

                    let obj = {};
                    obj.userId = userId,
                        obj.amount = amount,
                        obj.short_name = short_name,
                        obj.wallet = 'Amount added in P2P Balance'

                    // Create Swapping History
                    let swap_data = await SwappingHistory.create(obj);

                    return res.status(200).json({ success: true, message: "Amount transfered Successfully", data: [] })
                } else {
                    return res.status(500).json({ success: false, message: "Amount transfering failed", data: [] })
                }


            } else {

                // Step 1 Check if amount is available for transfering
                let funds = await Wallets.findOne({
                    $and: [
                        { user_id: userId },
                        { short_name: short_name }
                    ]
                })



                if (amount > funds.p2p_balance) {
                    return res.status(500).json({ success: false, message: "Insufficient Balance to transfer", data: [] })
                }

                // Deduct from P2P Balance
                let update_funds = await WalletController.update_p2p_balance(userId, funds.currency_id, -amount)


                // Amount added to Spot Balance
                let update_spot = await WalletController.updateBalance(userId, funds.currency_id, amount)



                if (update_funds === true && update_spot === true) {

                    // Add Logs
                    let activity_data = {};
                    activity_data.Activity = "Amount added in Funding Wallet",
                        activity_data.IP = req.socket.remoteAddress,
                        activity_data.userId = userId,
                        activity_data.date = new Date();
                    let add_logs = await logs.create(activity_data)

                    let obj = {};
                    obj.userId = userId,
                        obj.amount = amount,
                        obj.short_name = short_name,
                        obj.wallet = 'Amount added in Spot Balance'

                    // Create Swapping History
                    let swap_data = await SwappingHistory.create(obj);

                    return res.status(200).json({ success: true, message: "Amount transfered Successfully", data: [] })
                } else {
                    return res.status(500).json({ success: false, message: "Amount transfering failed", data: [] })
                }
            }


        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    admin_payments: async (req, res) => {
        try {
            const { payment_type } = req.body;

            let obj = {
                payment_type: payment_type
            }

            let data = await PaymentTypes.create(obj);

            if (data) {
                return res.status(200).json({ success: true, message: "Payment Type added", data: data })
            } else {
                return res.status(500).json({ success: false, message: "Some error occured in adding Payment Type", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    remove_payments: async (req, res) => {
        try {
            const { _id } = req.body;

            let data = await PaymentTypes.findByIdAndDelete({ _id });
            if (data) {
                return res.status(200).json({ success: true, message: "Payment type removed", data: data })
            } else {
                return res.status(500).json({ success: false, message: "Some error occured", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    payment_type_list: async (req, res) => {
        try {
            let data = await PaymentTypes.find();

            if (data) {
                return res.status(200).json({ success: true, message: 'Payment type list fetched', data: data })
            } else {
                return res.status(500).json({ success: false, message: 'No Payment Type added', data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    trader_confirmation: async (req, res) => {
        try {
            const { order_id, trader_status } = req.body;

            let order = await P2P_transactions.findOne({ order_id: order_id });

            let find_order = await P2P_transactions.updateOne({ order_id: order_id }, {
                $set: {
                    trader_status: trader_status
                }
            },
                { upsert: true }
            );

            return res.status(200).json({ success: true, message: "Status Updated successfully", data: order })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    merchant_confirmation: async (req, res) => {
        try {
            const { order_id, merchant_status } = req.body;

            let order = await P2P_transactions.findOne({ order_id: order_id });

            let find_order = await P2P_transactions.updateOne({ order_id: order_id }, {
                $set: {
                    merchant_status: merchant_status
                }
            },
                { upsert: true }
            );

            return res.status(200).json({ success: true, message: "Status Updated successfully", data: order })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    resolve_dispute: async (req, res) => {
        try {
            const { order_id } = req.body;

            // Find the order with Order ID

            let find_order = await P2P_transactions.findOne({ order_id: order_id });



            if (find_order.payment_type === "P2P Wallet") {

                // 
                if (find_order.trader_status === "CONFIRMED" || find_order.merchant_status === "CONFIRMED") {

                    let wallet = await Wallets.findOne({
                        $and: [
                            { trader_id: find_order.trader_id },
                            { short_name: find_order.base_short_name }
                        ]
                    });



                    // Deduct Balance from P2P Locked balance
                    let update_wallet = await WalletController.update_p2p_locked(find_order.trader_id, wallet.currency_id, -find_order.amount)


                    // Update P2P Balance
                    let p2p_balance = await WalletController.update_p2p_balance(find_order.trader_id, wallet.currency_id, find_order.amount)


                    return res.status(200).json({ success: true, message: "Amount transferred", data: [] })
                }
            } else {
                let obj = {
                    Post_userId: find_order.userId,
                    Trader_Id: find_order.trader_id
                }

                return res.status(200).json({ success: true, message: "Traders ID", data: obj })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    all_p2p_orders: async (req, res) => {
        try {
            let data = await P2P_transactions.find({
                description: "P2P trading"
            });

            if (data) {
                return res.status(200).json({ success: true, message: "All P2P Orders fetched", data: data })
            } else {
                return res.status(500).json({ success: false, message: "No P2P transactions found", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },


    notify_trader: async (req, res) => {
        try {
            const { order_id } = req.body;

            let data = await P2P_transactions.findOne({ order_id: order_id });

            let merchant = await Users.findOne({ _id: data.postAd_user })
            let trader = await Users.findOne({ _id: data.trader_id })

            // Check SIDE of Order
            if (data.side === 'SELL') {

                // Check if seller status is CONFIRMED
                if (data.merchant_status === 'CONFIRMED') {


                    // Deduct amount from Merchant's locked balance
                    let update_wallet = await WalletController.update_p2p_locked(data.postAd_user, data.base_currency_id, -data.receiving_amount)

                    // Update P2P Balance in Traders Wallet
                    let p2p_balance = await WalletController.update_p2p_balance(data.trader_id, data.base_currency_id, data.receiving_amount)

                    // Update Order Status
                    let order_status = await P2P_transactions.updateOne({ order_id: order_id }, {
                        $set: {
                            status: "CONFIRMED"
                        }
                    })

                    let post_status = await P2P_transactions.updateOne({ _id: data.add_id }, {
                        $set: {
                            status: "CONFIRMED"
                        }
                    })

                    let trades = merchant.p2p_trades + 1;
                    let trades2 = trader.p2p_trades + 1;
                    // Update Total Order's 
                    let updateMerchantOrder = await Users.updateOne({ _id: merchant._id }, {
                        $set: {
                            p2p_trades: trades
                        }
                    })

                    let updateTraderOrder = await Users.updateOne({ _id: trader._id }, {
                        $set: {
                            p2p_trades: trades2
                        }
                    })


                    return res.status(200).json({ success: true, message: "Notified successfully", data: [] })

                } else if (data.trader_status === "DISPUTE" || data.merchant_status === 'DISPUTE') {
                    return res.status(200).json({ success: true, message: "Your Order is in Dispute, Please raise a ticket" })
                }
                else {
                    return res.status(200).json({ success: true, message: "Notified successfully", data: [] })
                }

            } else if (data.side === 'BUY') {

                // Check if seller status is CONFIRMED
                if (data.trader_status === 'CONFIRMED') {

                    // Deduct amount from Merchant's locked balance
                    let update_wallet = await WalletController.update_p2p_locked(data.trader_id, data.base_currency_id, -data.amount)

                    // Update P2P Balance in Traders Wallet
                    let p2p_balance = await WalletController.update_p2p_balance(data.postAd_user, data.base_currency_id, data.amount)

                    // Update Order Status
                    let order_status = await P2P_transactions.updateOne({ order_id: order_id }, {
                        $set: {
                            status: "CONFIRMED"
                        }
                    })

                    // Update Post Status
                    let post_status = await P2P_transactions.updateOne({ _id: data.add_id }, {
                        $set: {
                            status: "CONFIRMED"
                        }
                    })


                    let trades = merchant.p2p_trades + 1;
                    let trades2 = trader.p2p_trades + 1;
                    // Update Total Order's 
                    let updateMerchantOrder = await Users.updateOne({ _id: merchant._id }, {
                        $set: {
                            p2p_trades: trades
                        }
                    })

                    let updateTraderOrder = await Users.updateOne({ _id: trader._id }, {
                        $set: {
                            p2p_trades: trades2
                        }
                    })


                    return res.status(200).json({ success: true, message: "Notified successfully", data: [] })

                } else if (data.trader_status === "DISPUTE" || data.merchant_status === 'DISPUTE') {
                    return res.status(200).json({ success: true, message: "Your Order is in Dispute, Please raise a ticket" })
                }
                else if (data.merchant_status === 'CONFIRMED') {
                    return res.status(200).json({ success: true, message: "" })
                }
                else {
                    return res.status(200).json({ success: true, message: "Notified successfully", data: [] })
                }
            }


        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    add_order_notification: async (req, res) => {
        try {
            const { userId } = req.user;
            const { order_id } = req.body;

            let orderData = await P2P_transactions.findOne({ order_id: order_id });

            let trader = await Users.findOne({ _id: orderData?.trader_id });
            let merchant = await Users.findOne({ _id: orderData?.postAd_user });

            if (orderData.side === 'BUY') {

                if (orderData.postAd_user === userId) {
                    let submit = await email_marketing('buyerFundTransferred', orderData, trader.emailId,)
                    return res.status(200).json({ success: true, message: "Notification Sent to Seller", data: submit })

                }
                else if (orderData.trader_id === userId) {
                    let submit = await email_marketing('sellerFundTransferred', orderData, merchant.emailId)
                    return res.status(200).json({ success: true, message: "Notification Sent to Buyer", data: submit })
                }
            } else if (orderData.side === 'SELL') {
                if (orderData.postAd_user === userId) {
                    let submit = await email_marketing('sellerFundTransferred', orderData, trader.emailId)
                    return res.status(200).json({ success: true, message: "Notification Sent to Buyer", data: submit })
                }
                else if (orderData.trader_id === userId) {
                    let submit = await email_marketing('buyerFundTransferred', orderData, merchant.emailId,)
                    return res.status(200).json({ success: true, message: "Notification Sent to Seller", data: submit })
                }
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    my_order_notification: async (req, res) => {
        try {
            const { userId } = req.user;

            let user = await OrderNotifications.find({ trader_id: userId });

            let user1 = await OrderNotifications.find({ postAd_user: userId });

            let obj = {
                BuyOrder: user,
                SellOrder: user1
            }

            if (user) {
                return res.status(200).json({ success: true, message: "My Order Notifications fetched", data: obj })
            } else {
                return res.status(200).json({ success: true, message: "No Order Notification found", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    post_status: async (req, res) => {
        try {
            const { status, post_id } = req.body;

            if (status === 'INACTIVE') {

                // Fetch Merchant's Wallet
                let merchant_wallet = await Wallets.findOne({
                    $and: [
                        { user_id: post_id.postAd_user },
                        { short_name: post_id.base_short_name }
                    ]
                });



                // Deduct Amount from P2P Locked Balance 
                let update_wallet = await WalletController.update_p2p_locked(post_id.postAd_user, merchant_wallet.short_name, -post_id.max_amount)


                // Update P2P Balance
                let p2p_balance = await WalletController.update_p2p_balance(post_id.postAd_user, merchant_wallet.currency_id, post_id.max_amount)


                return res.status(200).json({ success: true, message: "Status updated successfully", data: [] })
            } else {

                // If Merchant updates the status again to ACTIVE, 
                // then deduct balance from his P2P Balance and update to P2P locked

                let merchant_wallet = await Wallets.findOne({
                    $and: [
                        { user_id: post_id.postAd_user },
                        { short_name: post_id.base_short_name }
                    ]
                });



                // Update P2P Balance
                let p2p_balance = await WalletController.update_p2p_balance(post_id.postAd_user, merchant_wallet.currency_id, -post_id.max_amount)


                // Deduct Amount from P2P Locked Balance 
                let update_wallet = await WalletController.update_p2p_locked(post_id.postAd_user, merchant_wallet.short_name, post_id.max_amount)


                return res.status(200).json({ success: true, message: "Status updated successfully", data: [] })

            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    order_details: async (req, res) => {
        try {
            const { order_id } = req.body;

            let data = await P2P_transactions.find({ order_id: order_id });

            return res.status(200).json({ success: true, message: "Order Details fetched", data: data })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    statusToSettle: async (req, res) => {
        try {
            const { order_id } = req.body;
            let data = await P2P_transactions.findOne({ order_id: order_id });
            await P2P_transactions.updateOne({ order_id: order_id }, { $set: { status: 'SETTLED' } })
            await P2P_transactions.updateOne({ _id: data.add_id }, { $set: { status: 'SETTLED' } })
            return res.status(200).json({ success: true, message: "Status updated", })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    dispute_handling: async (req, res) => {
        try {
            const { order_id } = req.body;

            // Find the Transaction
            let data = await P2P_transactions.findOne({ order_id: order_id });

            if (data.status === 'DISPUTE') {
                if (data.trader_status === 'CONFIRMED' && data.merchant_status != 'CONFIRMED') {


                    // Transfer the funds to Trader from Merchant's P2P locked balance
                    let merchant_wallet = await Wallets.findOne({
                        $and: [
                            { user_id: data.postAd_user },
                            { short_name: data.base_short_name }
                        ]
                    });

                    let trader_wallet = await Wallets.findOne({
                        $and: [
                            { user_id: data.trader_id },
                            { short_name: data.base_short_name }
                        ]
                    });

                    // Update P2P Balance
                    let p2p_balance = await WalletController.update_p2p_locked(data.postAd_user, merchant_wallet.currency_id, -data.receiving_amount)


                    // Deduct Amount from P2P Locked Balance 
                    let update_wallet = await WalletController.update_p2p_balance(data.trader_id, trader_wallet.currency_id, data.receiving_amount)


                    // Update the status of transaction to SETTLED so that user cannot earn from this POST
                    let find_add = await P2P_transactions.findOne({ _id: data.add_id });


                    let update_order = await P2P_transactions.updateOne({ order_id: order_id }, {
                        $set: {
                            status: 'SETTLED'
                        }
                    })

                    let update_add = await P2P_transactions.updateOne({ _id: data.add_id }, {
                        $set: {
                            status: 'SETTLED'
                        }
                    })

                    let orderObj = {
                        trader_id: data.trader_id,
                        order_id: order_id,
                        postAd_user: data.postAd_user,
                        status: 'LATEST',
                        message: `Order has been resolved, ${data.receiving_amount} are transfered to this ${data.trader_id} ID`
                    }

                    // Send Notificaion
                    let add_notification = await OrderNotifications.create(orderObj)


                    return res.status(200).json({ success: true, message: `Funds transfered to Trader ${data.trader_id}`, data: [] })

                } else if (data.trader_status != 'CONFIRMED' && data.merchant_status == 'CONFIRMED') {

                    // Deduct the amount from Trader's Locked to Merchant P2P Balance
                    let merchant_wallet = await Wallets.findOne({
                        $and: [
                            { user_id: data.postAd_user },
                            { short_name: data.base_short_name }
                        ]
                    });
                    let trader_wallet = await Wallets.findOne({
                        $and: [
                            { user_id: data.trader_id },
                            { short_name: data.base_short_name }
                        ]
                    });
                    // Update P2P Balance
                    let p2p_balance = await WalletController.update_p2p_locked(data.trader_id, trader_wallet.currency_id, -data.amount)


                    // Add Amount to P2P Locked Balance 
                    let update_wallet = await WalletController.update_p2p_balance(data.postAd_user, merchant_wallet.currency_id, data.amount)


                    let update_order = await P2P_transactions.updateOne({ order_id: order_id }, {
                        $set: {
                            status: 'SETTLED'
                        }
                    })

                    let update_add = await P2P_transactions.updateOne({ _id: data.add_id }, {
                        $set: {
                            status: 'SETTLED'
                        }
                    })

                    let orderObj = {
                        trader_id: data.trader_id,
                        order_id: order_id,
                        postAd_user: data.postAd_user,
                        status: 'LATEST',
                        message: `Order has been resolved, ${data.amount} are transfered to this ${data.postAd_user} ID in P2P Balance`
                    }

                    // Send Notificaion
                    let add_notification = await OrderNotifications.create(orderObj)


                    return res.status(200).json({ success: true, message: `Amount transfered to Merchant P2P Balance ${data.postAd_user}`, data: [] })

                } else if (data.trader_status != 'CONFIRMED' && data.merchant_status != 'CONFIRMED') {
                    // Check the side
                    if (data.side === 'BUY') {
                        // Transfer the amount from Trader's Locked to Trader's P2P Balance
                        let trader_wallet = await Wallets.findOne({
                            $and: [
                                { user_id: data.trader_id },
                                { short_name: data.base_short_name }
                            ]
                        });

                        // Update P2P Balance
                        let p2p_balance = await WalletController.update_p2p_locked(data.trader_id, trader_wallet.currency_id, -data.amount)


                        // Add Amount to P2P Locked Balance 
                        let update_wallet = await WalletController.update_p2p_balance(data.trader_id, trader_wallet.currency_id, data.amount)


                        let update_order = await P2P_transactions.updateOne({ order_id: order_id }, {
                            $set: {
                                status: 'SETTLED'
                            }
                        })

                        let update_add = await P2P_transactions.updateOne({ _id: data.add_id }, {
                            $set: {
                                status: 'SETTLED'
                            }
                        })

                        let orderObj = {
                            trader_id: data.trader_id,
                            order_id: order_id,
                            postAd_user: data.postAd_user,
                            status: 'LATEST',
                            message: `Order has been resolved, ${data.amount} are transfered to this ${data.trader_id} ID in P2P Balance`
                        }

                        // Send Notificaion
                        let add_notification = await OrderNotifications.create(orderObj)


                        return res.status(200).json({ success: true, message: `Amount transfered from Trader's P2P Balance ${data.postAd_user}`, data: [] })

                    } else {

                        // Transfer the amount from Merchant's Locked to Merchant's P2P Balance
                        let merchant_wallet = await Wallets.findOne({
                            $and: [
                                { user_id: data.postAd_user },
                                { short_name: data.base_short_name }
                            ]
                        });

                        // Update P2P Balance
                        let p2p_balance = await WalletController.update_p2p_locked(data.postAd_user, merchant_wallet.currency_id, -data.receiving_amount)


                        // Add Amount to P2P Locked Balance 
                        let update_wallet = await WalletController.update_p2p_balance(data.postAd_user, merchant_wallet.currency_id, data.receiving_amount)


                        let update_order = await P2P_transactions.updateOne({ order_id: order_id }, {
                            $set: {
                                status: 'SETTLED'
                            }
                        })

                        let update_add = await P2P_transactions.updateOne({ _id: data.add_id }, {
                            $set: {
                                status: 'SETTLED'
                            }
                        })

                        let orderObj = {
                            trader_id: data.trader_id,
                            order_id: order_id,
                            postAd_user: data.postAd_user,
                            status: 'LATEST',
                            message: `Order has been resolved, ${data.receiving_amount} are transfered to this ${data.postAd_user} ID in P2P Balance`
                        }

                        // Send Notificaion
                        let add_notification = await OrderNotifications.create(orderObj)


                        return res.status(200).json({ success: true, message: `Amount transfered to Merchant P2P Balance ${data.postAd_user}`, data: [] })
                    }
                }
            } else if (data.status === 'CANCELLED') {

                if (data.trader_status != 'CONFIRMED' && data.merchant_status != 'CONFIRMED') {
                    if (data.side === 'BUY') {

                        // Transfer the amount of Merchant to his P2P Balance wallet
                        let merchant_wallet = await Wallets.findOne({
                            $and: [
                                { user_id: data.postAd_user },
                                { short_name: data.base_short_name }
                            ]
                        });

                        // Update P2P Balance
                        let p2p_balance = await WalletController.update_p2p_locked(data.postAd_user, merchant_wallet.currency_id, -data.amount)


                        // Add Amount to P2P Locked Balance 
                        let update_wallet = await WalletController.update_p2p_balance(data.postAd_user, merchant_wallet.currency_id, data.amount)


                        let update_order = await P2P_transactions.updateOne({ order_id: order_id }, {
                            $set: {
                                status: 'SETTLED'
                            }
                        })

                        let update_add = await P2P_transactions.updateOne({ _id: data.add_id }, {
                            $set: {
                                status: 'SETTLED'
                            }
                        })

                        let orderObj = {
                            trader_id: data.trader_id,
                            order_id: order_id,
                            postAd_user: data.postAd_user,
                            status: 'LATEST',
                            message: `Order has been resolved, ${data.amount} are transfered to this ${data.postAd_user} ID in P2P Balance`
                        }

                        // Send Notificaion
                        let add_notification = await OrderNotifications.create(orderObj)


                        return res.status(200).json({ success: true, message: `Amount transfered to Merchant P2P Balance ${data.postAd_user}`, data: [] })
                    } else {

                        // Transfer the amount of Merchant to his P2P Balance wallet
                        let merchant_wallet = await Wallets.findOne({
                            $and: [
                                { user_id: data.postAd_user },
                                { short_name: data.base_short_name }
                            ]
                        });

                        // Update P2P Balance
                        let p2p_balance = await WalletController.update_p2p_locked(data.postAd_user, merchant_wallet.currency_id, -data.receiving_amount)


                        // Add Amount to P2P Locked Balance 
                        let update_wallet = await WalletController.update_p2p_balance(data.postAd_user, merchant_wallet.currency_id, data.receiving_amount)


                        let update_order = await P2P_transactions.updateOne({ order_id: order_id }, {
                            $set: {
                                status: 'SETTLED'
                            }
                        })

                        let update_add = await P2P_transactions.updateOne({ _id: data.add_id }, {
                            $set: {
                                status: 'SETTLED'
                            }
                        })

                        let orderObj = {
                            trader_id: data.trader_id,
                            order_id: order_id,
                            postAd_user: data.postAd_user,
                            status: 'LATEST',
                            message: `Order has been resolved, ${data.receiving_amount} are transfered to this ${data.postAd_user} ID in P2P Balance`
                        }

                        // Send Notificaion
                        let add_notification = await OrderNotifications.create(orderObj)


                        return res.status(200).json({ success: true, message: `Amount transfered to Merchant P2P Balance ${data.postAd_user}`, data: [] })
                    }

                }
            }

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    request_refund: async (req, res) => {
        try {
            const { order_id } = req.body;
            const { userId } = req.user;
            let order = await P2P_transactions.findOne({ order_id: order_id });

            if (!order) {
                return res.status(402).json({ success: false, message: "No order found", data: [] })
            }

            if (order?.status === "CANCELLED" && order?.merchant_status === "PENDING" && order?.trader_status === "PENDING" && order?.refundedToSeller === false && userId === order?.trader_id && order?.side === "BUY") {

                await WalletController.update_p2p_balance(userId, order.base_currency_id, order?.amount)
                await WalletController.update_p2p_locked(userId, order.base_currency_id, -order?.amount)

                await P2P_transactions.updateOne({ order_id: order_id }, { $set: { refundedToSeller: true } });

                await WalletTransaction.updateOne({ order_id: order_id }, { $set: { description: "P2P Refund" } }, { upsert: true })

                return res.status(200).json({ success: true, message: "Refund Initiated" })

            } else {
                return res.status(402).json({ success: true, message: "Not eligible for refund" })
            }

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },


}