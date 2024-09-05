const Currency = require('../models/Currency');
const Orderbook = require('../models/Orderbook')
const Exchange = require('../models/Exchange');
const Wallets = require('../models/Wallets');
const Pairs = require('../models/Pairs');
const Tickers = require('../models/Ticker')
const { ObjectId } = require('mongodb');
const { executeOrder } = require('../middleware/BullMq');
const logs = require('../models/logs');
// const eventEmitter = require('../utils/UpdatePrice')
 
module.exports = {
    place_order: async (req, res) => {
        
        // return res
        //                 .status(422)
        //                 .json({
        //                     success: false,
        //                     message: "Trading is temporarily off. Please try again later.",
        //                     data: [],
        //                 });
       
        try {
            const { userId } = req.user;
            // const finduser1 = await Users.findOne({_id:userId});

            // if(finduser1.kycVerified===1){
            //     return res.status(404).json({success: false, message: 'Your KYC is not approved by the admin. Please be patient.'})
            // }
            // if(finduser1.kycVerified===0 || finduser1.kycVerified === 3 ){
            
            //     return res.status(404).json({success: false, message: 'First Complete Your KYC to Place Order '})
            // }
       
            let data = req.body;
            let amount = data.price * data.quantity;
            let quantity = data.quantity;
            let coin;

            if(data.price <= 0) {
                return res.status(400).json({success: false, message: 'Order Cannot be placed with zero price', data: []})
            } else if(data.quantity <= 0) {
                return res.status(400).json({success: false, message: 'Order Cannot be placed with zero quantity', data: []})
            }
            
            // Check if user have enough balance or not to place this order
            let quote_balance = await Wallets.findOne({
                $and: [
                    { user_id: userId },
                    { currency_id: data.quote_currency_id },
                ],
            });            
            let ask_balance = await Wallets.findOne({
                $and: [
                    { user_id: userId },
                    { currency_id: data.base_currency_id },
                ],
            });

            if (data.side === "BUY") {
                if (amount > quote_balance.balance) {
                    return res
                        .status(422)
                        .json({
                            success: false,
                            message: "Insufficient balance to place this order",
                            data: [],
                        });
                } else {
                    // Deduct the amount from users wallet
                    let deduct_balance = await Wallets.updateOne(
                        {
                            $and: [
                                { user_id: userId },
                                { currency_id: data.quote_currency_id },
                            ],
                        },
                        {
                            $inc: {
                                balance: -amount,
                                locked_balance: amount,
                            },
                        },
                        { upsert: true }
                    );
                }
                let quote_balance2 = await Wallets.findOne({
                    $and: [
                        { user_id: userId },
                        { currency_id: data.quote_currency_id },
                    ],
                });
                
            } else {
                
                if (quantity > ask_balance.balance) {
                    return res
                        .status(422)
                        .json({
                            success: false,
                            message: "Insufficient balance to place this order",
                            data: [],
                        });
                } else {
                    // Deduct the amount from users wallet
                    
                    let deduct_balance = await Wallets.updateOne(
                        {
                            $and: [
                                { user_id: userId },
                                { currency_id: data.base_currency_id },
                            ],
                        },
                        {
                            $inc: {
                                balance: -quantity,
                                locked_balance: quantity,
                            },
                        },
                        { upsert: true }
                    );
                    let ask_balance2 = await Wallets.findOne({
                        $and: [
                            { user_id: userId },
                            { currency_id: data.base_currency_id },
                        ],
                    });
                                                                                                                                                                                                                                                                                                                                   
                }
            }

            data.user_id = userId;
            data.status = "PENDING";
            data.remaining = data.quantity;
            if (data.side === "BUY") {
                coin = await Currency.findOne({ _id: data.base_currency_id });
                (data.transaction_fee = coin.transaction_fee),
                (data.tds = coin.tds);
                data.maker_fee = coin.maker_fee
                data.taker_fee = coin.taker_fee
                data.ask_currency = coin.short_name;
            } else {
                coin = await Currency.findOne({ _id: data.quote_currency_id });
                
                (data.transaction_fee = coin.transaction_fee),
                (data.tds = coin.tds);
                data.maker_fee = coin.maker_fee
                data.taker_fee = coin.taker_fee
                data.ask_currency = coin.short_name;
            }
            
            // eventEmitter.emit('globalupdate');
            await executeOrder(data)

            // Log activity
            let activity_data = {
                Activity: "Trading",
                IP: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                userId: userId,
                date: new Date()
            };
            let add_logs = await logs.create(activity_data);
           


            return res
                    .status(200)
                    .json({
                        success: true,
                        message: "order placed successfully",
                        data: data,
                    });

            /* // Create a new order
            let order = await Orderbook.create(data);
            if (order) {
                let executed = await engineFifo(order)
                
                if(executed) {
                    
                    let find_order = await Orderbook.findOne({_id: order._id})
                    
                    if(find_order != null) {
                        if((find_order.remaining == 0) && (find_order.quantity == find_order.filled)) {
                            let update = await Orderbook.updateOne(
                                { _id: find_order._id },
                                {
                                    $set: {
                                        status: 'FILLED',
                                    }
                                },
                                { upsert: true }
                            );
                            console.log(update, " : updated or not ?")
                        } else {
                            console.log('order is not completed yet')
                        }
                    }
                }
                return res
                    .status(200)
                    .json({
                        success: true,
                        message: "order placed successfully",
                        data: order,
                    });
            } else {
                return res
                    .status(406)
                    .json({
                        success: false,
                        message: "some error occured while placing order",
                        data: [],
                    });
            } */
        } catch (error) {
            return res
                .status(500)
                .json({ success: false, message: error.message, data: [] });
        }
    },

    // place_order_bot: async (userId, data) => {
    //     try {
    //         let amount = data.price * data.quantity;
    //         let quantity = data.quantity;
    //         let coin;

    //         if(data.price <= 0) {
    //             return res.status(400).json({
    //                 success: false,
    //                 message: "Order Cannot be placed with zero price",
    //             });
                
    //         } else if(data.quantity <= 0) {
    //             return res.status(400).json({
    //                 success: false,
    //                 message: "Order Cannot be placed with zero quantity",
    //             });
    //         }

    //         // Check if user have enough balance or not to place this order


    //          // Check if user have enough balance or not to place this order
    //          let quote_balance = await Wallets.findOne({
    //             $and: [
    //                 { user_id: userId },
    //                 { currency_id: data.quote_currency_id },
    //             ],
    //         });
    //         let ask_balance = await Wallets.findOne({
    //             $and: [
    //                 { user_id: userId },
    //                 { currency_id: data.base_currency_id },
    //             ],
    //         });

    //         data.user_id = userId;
    //         data.status = "PENDING";
    //         data.remaining = data.quantity;
    //         let check_master = false //await Users.getUserById(userId);
    //         if (data.side === "BUY") {
    //             if (amount > quote_balance.balance) {
    //                 return res.status(422).json({
    //                     success: false,
    //                     message: "Insufficient balance to place this order",
    //                 });
    //             } else {
    //                  // Deduct the amount from users wallet
    //                  let deduct_balance = await Wallets.updateOne(
    //                     {
    //                         $and: [
    //                             { user_id: userId },
    //                             { currency_id: data.quote_currency_id },
    //                         ],
    //                     },
    //                     {
    //                         $inc: {
    //                             balance: -amount,
    //                             locked_balance: amount,
    //                         },
    //                     },
    //                     { upsert: true }
    //                 );
    //                 // await Wallets.updateBothBalanceByCoinId(userId, data.quote_currency_id, -amount, amount);
    //             }
    //             coin = await Currency.findOne({ _id: data.base_currency_id });
    //             if(check_master && check_master.master_account) {
    //                 data.maker_fee = check_master.maker_fee
    //                 data.taker_fee = check_master.taker_fee
    //             } else {
    //                 data.maker_fee = coin.maker_fee
    //                 data.taker_fee = coin.taker_fee
    //             }
    //             (data.transaction_fee = coin.transaction_fee),
    //             (data.tds = coin.tds);
    //             data.ask_currency = coin.short_name;
    //         } else {
    //             if (quantity > ask_balance.balance) {
    //                 return res.status(422).json({
    //                     success: false,
    //                     message: "Insufficient balance to place this order",
    //                 });
    //             } else {
    //                  // Deduct the amount from users wallet
    //                  let deduct_quantity = await Wallets.updateOne(
    //                     {
    //                         $and: [
    //                             { user_id: userId },
    //                             { currency_id: data.base_currency_id },
    //                         ],
    //                     },
    //                     {
    //                         $inc: {
    //                             balance: -quantity,
    //                             locked_balance: quantity,
    //                         },
    //                     },
    //                     { upsert: true }
    //                 );   
    //             }
    //             coin = await Currency.findOne({ _id: data.quote_currency_id });

    //             if(check_master && check_master.master_account) {
    //                 data.maker_fee = check_master.maker_fee
    //                 data.taker_fee = check_master.taker_fee
    //             } else {
    //                 data.maker_fee = coin.maker_fee
    //                 data.taker_fee = coin.taker_fee
    //             }
    //             (data.transaction_fee = coin.transaction_fee),
    //             (data.tds = coin.tds);
    //             data.ask_currency = coin.short_name;
    //         }

    //         await executeOrder(data)
    //         // await EngineController.both_currency_sell_orders(data.base_currency_id, data.quote_currency_id, true)
    //         // await EngineController.both_currency_buy_orders(data.base_currency_id, data.quote_currency_id, true)
    //         // await EngineController.recent_trade(data.base_currency_id, data.quote_currency_id, true)
    //         // Create a new order
    //         /* let order = await Orderbook.createNewOrder(data);
    //         if (order) {
    //             let executed = await engineFifo(order)
    //             if(executed) {
    //                 let find_order = await Orderbook.findOrderById(order._id)
    //                 if(find_order) {
    //                     if((find_order.remaining == 0) && (find_order.quantity == find_order.filled)) {
    //                         let update = await Orderbook.updateOrderStatusAndRemaining(find_order._id, 'FILLED', 0);
    //                     } else {
                             
    //                     }
    //                 }
    //             }
    
    //             await EngineController.both_currency_sell_orders(data.base_currency_id, data.quote_currency_id, true)

    //             await EngineController.both_currency_buy_orders(data.base_currency_id, data.quote_currency_id, true)
   
    //             await EngineController.recent_trade(data.base_currency_id, data.quote_currency_id, true)
   
    //             return order;
    //         } else {
    //             throw await errorHandler("Some error occured while placing order", 422);
    //         } */
    //     } catch (error) {
    //         return res
    //             .status(500)
    //             .json({ success: false, message: error.message, data: [] });
    //     }
    // },


    place_order_bot: async (userId, data) => {
        try {
            let amount = data.price * data.quantity;
            let quantity = data.quantity;
            let coin;

            if (data.price <= 0) {
                return {
                    success: false,
                    message: "Order cannot be placed with zero price",
                };
            } else if (data.quantity <= 0) {
                return {
                    success: false,
                    message: "Order cannot be placed with zero quantity",
                };
            }

            // Check if the user has enough balance to place this order
         

            let quote_balance = await Wallets.findOne({
                $and: [
                    { user_id: userId },
                    { currency_id: data.quote_currency_id },
                ],
            });

            let ask_balance = await Wallets.findOne({
                $and: [
                    { user_id: userId },
                    { currency_id: data.base_currency_id },
                ],
            });

            data.user_id = userId;
            data.status = "PENDING";
            data.remaining = data.quantity;
            let check_master = false; // await Users.getUserById(userId);

            if (data.side === "BUY") {
                if (amount > quote_balance.balance) {
                    return {
                        success: false,
                        message: "Insufficient balance to place this order",
                    };
                } else {
                    // Deduct the amount from the user's wallet
                    await Wallets.updateOne(
                        {
                            $and: [
                                { user_id: userId },
                                { currency_id: data.quote_currency_id },
                            ],
                        },
                        {
                            $inc: {
                                balance: -amount,
                                locked_balance: amount,
                            },
                        },
                        { upsert: true }
                    );
                }
                coin = await Currency.findOne({ _id: data.base_currency_id });
                if (check_master && check_master.master_account) {
                    data.maker_fee = check_master.maker_fee;
                    data.taker_fee = check_master.taker_fee;
                } else {
                    data.maker_fee = coin.maker_fee;
                    data.taker_fee = coin.taker_fee;
                }
                data.transaction_fee = coin.transaction_fee;
                data.tds = coin.tds;
                data.ask_currency = coin.short_name;
            } else {
                if (quantity > ask_balance.balance) {
                    return {
                        success: false,
                        message: "Insufficient balance to place this order",
                    };
                } else {
                    // Deduct the quantity from the user's wallet
                    await Wallets.updateOne(
                        {
                            $and: [
                                { user_id: userId },
                                { currency_id: data.base_currency_id },
                            ],
                        },
                        {
                            $inc: {
                                balance: -quantity,
                                locked_balance: quantity,
                            },
                        },
                        { upsert: true }
                    );
                }
                coin = await Currency.findOne({ _id: data.quote_currency_id });
                if (check_master && check_master.master_account) {
                    data.maker_fee = check_master.maker_fee;
                    data.taker_fee = check_master.taker_fee;
                } else {
                    data.maker_fee = coin.maker_fee;
                    data.taker_fee = coin.taker_fee;
                }
                data.transaction_fee = coin.transaction_fee;
                data.tds = coin.tds;
                data.ask_currency = coin.short_name;
            }

            await executeOrder(data);

            // Placeholder for additional actions
            /*
            await EngineController.both_currency_sell_orders(data.base_currency_id, data.quote_currency_id, true);
            await EngineController.both_currency_buy_orders(data.base_currency_id, data.quote_currency_id, true);
            await EngineController.recent_trade(data.base_currency_id, data.quote_currency_id, true);
            */

            return {
                success: true,
                message: "Order placed successfully",
            };
        } catch (error) {
            return {
                success: false,
                message: error.message,
            };
        }
    },

//ORDERBOOK OLD CODE (Without Matching Data from Logins)
    //         let orderbook = await Orderbook.aggregate([
    //              { 
    //     $match: {
    //         "order_type": "LIMIT",
    //         "user_id": { 
    //             "$exists": true, 
    //             "$ne": "64d6053ef0615d1e6dca0eab" 
    //         }
    //     } 
    // },
    //             { $addFields: { baseObjId: { $toObjectId: "$base_currency_id" }}  },
    //             { $addFields: { baseUserId: { $toObjectId: "$user_id" }}  },
    //             {
    //                 $lookup: {
    //                     from: 'currencies',
    //                     localField: 'baseObjId',
    //                     foreignField: '_id',
    //                     as: 'data'
    //                 }
    //             },
    //             { $unwind: '$data'},
    //             {
    //                 $lookup: {
    //                     from: 'logins',
    //                     localField: 'baseUserId',
    //                     foreignField: '_id',
    //                     as: 'userData'
    //                 }
    //             },
    //             { $unwind: '$userData'},
    //             { $addFields: {main_currency: '$data.short_name', user_email: '$userData.emailId'}},
    //             { $project: { data: 0, baseObjId: 0, userData: 0}},
    //         ]).sort({createdAt : -1});

    //         let totalCount = await Orderbook.countDocuments({ 
    //             "user_id": { 
    //                 "$exists": true, 
    //                 "$ne": "64d6053ef0615d1e6dca0eab" 
    //             } ,
    //             // "order_type": "LIMIT",
    //         });
  

    get_orderbook: async (req, res) => {
        try {
            const { skip, limit } = req.body;
            const parsedSkip = parseInt(skip) || 0;
            const parsedLimit = parseInt(limit) || 100; // Default limit can be set to 100
    
            let result = await Orderbook.aggregate([
                { 
                    $match: {
                        "order_type": "LIMIT",
                        "user_id": { 
                            "$exists": true, 
                            "$ne": "64d6053ef0615d1e6dca0eab" 
                        }
                    } 
                },
                { 
                    $addFields: { 
                        baseObjId: { $toObjectId: "$base_currency_id" },
                        baseUserId: { $toObjectId: "$user_id" }
                    }
                },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'baseUserId',
                        foreignField: '_id',
                        as: 'userData'
                    }
                },
                { $unwind: '$userData' }, // Ensure that only documents with matching user_id in logins are kept
                {
                    $facet: {
                        data: [
                            {
                                $lookup: {
                                    from: 'currencies',
                                    localField: 'baseObjId',
                                    foreignField: '_id',
                                    as: 'data'
                                }
                            },
                            { $unwind: '$data' },
                            { 
                                $addFields: { 
                                    main_currency: '$data.short_name', 
                                    user_email: '$userData.emailId', 
                                    user_mobileNumber: '$userData.mobileNumber' 
                                } 
                            },
                            { $project: { data: 0, baseObjId: 0, userData: 0 }},
                            { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
                            { $skip: parsedSkip },
                            { $limit: parsedLimit }
                        ],
                        totalCount: [
                            { $count: "count" }
                        ]
                    }
                },
                { 
                    $project: {
                        data: 1,
                        totalCount: { $arrayElemAt: ["$totalCount.count", 0] }
                    }
                }
            ]);
    
            return res
                .status(200)
                .json({
                    success: true,
                    message: "orderbook fetched successfully",
                    data: result.length > 0 ? result[0].data : [],
                    totalCount: result.length > 0 ? result[0].totalCount : 0,
                });
        } catch (error) {
            return res
                .status(500)
                .json({ success: false, message: error.message, data: [] });
        }
    },
    

    get_sell_orderbook: async (req, res) => {
        try {
            let orderbook = await Orderbook.find({
                $and: [{ side: "SELL" }, { status: { $ne: "FILLED" } }],
            });
            return res
                .status(200)
                .json({
                    success: true,
                    message: "orderbook fetched successfully",
                    data: orderbook,
                });
        } catch (error) {
            return res
                .status(500)
                .json({ success: false, message: error.message, data: [] });
        }
    },

    get_buy_orderbook: async (req, res) => {
        try {
            let orderbook = await Orderbook.find({
                $and: [{ side: "BUY" }, { status: { $ne: "FILLED" } }],
            });
            return res
                .status(200)
                .json({
                    success: true,
                    message: "orderbook fetched successfully",
                    data: orderbook,
                });
        } catch (error) {
            return res
                .status(500)
                .json({ success: false, message: error.message, data: [] });
        }
    },

    historical_data: async (req, res) => {
        try {
            const { base_currency, quote_currency, from, to,interval,limit } = req.body;

            let pair = await Pairs.findOne({$and: [{base_currency: base_currency}, {quote_currency: quote_currency}]})
            let ticker = await Tickers.find({
                $and: [
                    { base_currency: base_currency },
                    { quote_currency: quote_currency },
                    { time: {$gte: from }},
                    { time: {$lte: to }},
                ],
            }).select(
                "time high low open close volume base_currency_id quote_currency_id"
            ).limit(limit).sort({time: 1});

            let count = await Tickers.find({
                $and: [
                    { base_currency: base_currency },
                    { quote_currency: quote_currency },
                ],
            }).count()

            if (ticker.length > 0) {
                return res
                    .status(200)
                    .json({
                        success: true,
                        message: "Ticker data fetched successfully",
                        data: ticker,
                        count: count,
                        currency_ids: {
                            base_currency_id: ticker[0].base_currency_id,
                            quote_currency_id: ticker[0].quote_currency_id,
                        },
                    });
            } else {
                
                return res.status(200).json({success: true,message: "Ticker data fetched successfully",data: [],count: count,
                        currency_ids: {
                            base_currency_id: pair.base_currency_id,
                            quote_currency_id: pair.quote_currency_id,
                        },
                    });
            }
        } catch (error) {
            return res
                .status(500)
                .json({ success: false, message: error.message, data: [] });
        }
    },

    get_executed_orders: async (req, res) => {
        try {
            const { base_currency_id, quote_currency_id } = req.body;
            const { userId } = req.user;
            const query = {
                $and: [
                    { user_id: userId },
                    { base_currency_id: base_currency_id },
                    { quote_currency_id: quote_currency_id },
                    { status: { $ne: 'PENDING' } }
                ],
            };
    
            // Get the total count of matching documents
            const totalCount = await Orderbook.countDocuments(query);
    
            // Get the paginated results
            let orders = await Orderbook.find(query).sort({ createdAt: -1 });
            
            return res.status(200).json({
                success: true,
                message: "Past orders fetched successfully",
                data: orders,
                total_count: totalCount
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },
    
    get_all_open_orders: async (req, res) => {
        try {
            const { userId } = req.user;
            const query = {
                $and: [
                    { user_id: userId },
                    {status: { $in: ['PENDING', 'PARTIALLY EXECUTED'] }}
                ],
            };
    
            // Get the total count of matching documents
            const totalCount = await Orderbook.countDocuments(query);

            let orders = await Orderbook.aggregate([
                { $match: query },
                { $sort: { createdAt: -1 } },
                { $addFields: { baseObjId: { $toObjectId: "$base_currency_id" } } },
                { $addFields: { quoteObjId: { $toObjectId: "$quote_currency_id" } } },
                { $addFields: { userObjId: { $toObjectId: "$user_id" } } },
                // Lookup for base_currency_id
                {
                    $lookup: {
                        from: 'currencies',
                        localField: 'baseObjId',
                        foreignField: '_id',
                        as: 'base_currency_data'
                    }
                },
                { $unwind: '$base_currency_data' },
            
                {
                    $lookup: {
                        from: 'currencies',
                        localField: 'quoteObjId',
                        foreignField: '_id',
                        as: 'quote_currency_data'
                    }
                },
                { $unwind: '$quote_currency_data' },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'userObjId',
                        foreignField: '_id',
                        as: 'user_data'
                    }
                },
                { $unwind: '$user_data' },
                {
                    $addFields: {
                        base_currency_short_name: '$base_currency_data.short_name',
                        quote_currency_short_name: '$quote_currency_data.short_name',
                        user_email : '$user_data.emailId',
                        user_mobileNumber: '$user_data.mobileNumber'
                    }
                },
                
                {
                    $project: {
                        base_currency_data: 0,
                        quote_currency_data: 0,
                        baseObjId: 0,
                        quoteObjId: 0,
                        user_data: 0,
                        userObjId: 0
                    }
                }
            ]);
    
            return res.status(200).json({
                success: true,
                message: "All Open orders fetched successfully",
                data: orders,
                total_count: totalCount
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },

    get_all_open_orders_admin: async (req, res) => {
        try {
                const query = {
                $and: [
                    {status: { $in: ['PENDING', 'PARTIALLY EXECUTED'] }},
                    {user_id : {$exists : true, $ne : "64d6053ef0615d1e6dca0eab"}},
                ],
            };
    
            // Get the total count of matching documents
            const totalCount = await Orderbook.countDocuments(query);

            let orders = await Orderbook.aggregate([
                { $match: query },
                { $sort: { createdAt: -1 } },
                { $addFields: { baseObjId: { $toObjectId: "$base_currency_id" } } },
                { $addFields: { quoteObjId: { $toObjectId: "$quote_currency_id" } } },
                { $addFields: { userObjId: { $toObjectId: "$user_id" } } },
                // Lookup for base_currency_id
                {
                    $lookup: {
                        from: 'currencies',
                        localField: 'baseObjId',
                        foreignField: '_id',
                        as: 'base_currency_data'
                    }
                },
                { $unwind: '$base_currency_data' },
            
                {
                    $lookup: {
                        from: 'currencies',
                        localField: 'quoteObjId',
                        foreignField: '_id',
                        as: 'quote_currency_data'
                    }
                },
                { $unwind: '$quote_currency_data' },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'userObjId',
                        foreignField: '_id',
                        as: 'user_data'
                    }
                },
                { $unwind: '$user_data' },
                {
                    $addFields: {
                        base_currency_short_name: '$base_currency_data.short_name',
                        quote_currency_short_name: '$quote_currency_data.short_name',
                        user_email : '$user_data.emailId',
                        user_mobileNumber: '$user_data.mobileNumber'
                    }
                },
                
                {
                    $project: {
                        base_currency_data: 0,
                        quote_currency_data: 0,
                        baseObjId: 0,
                        quoteObjId: 0,
                        user_data: 0,
                        userObjId: 0
                    }
                }
            ]);
    
            return res.status(200).json({
                success: true,
                message: "All Open orders fetched successfully",
                data: orders,
                total_count: totalCount
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },

    delete_all_open_orders_admin: async (req, res) => {
        try {
                const query = {
                $and: [
                    {status: { $in: ['PENDING', 'PARTIALLY EXECUTED'] }},
                    {user_id : {$exists : true, $ne : "64d6053ef0615d1e6dca0eab"}},
                ],
            };
    
            // Get the total count of matching documents
            const totalCount = await Orderbook.countDocuments(query);

            let orders = await Orderbook.aggregate([
                { $match: query },
                { $sort: { createdAt: -1 } },
                { $addFields: { baseObjId: { $toObjectId: "$base_currency_id" } } },
                { $addFields: { quoteObjId: { $toObjectId: "$quote_currency_id" } } },
                { $addFields: { userObjId: { $toObjectId: "$user_id" } } },
                // Lookup for base_currency_id
                {
                    $lookup: {
                        from: 'currencies',
                        localField: 'baseObjId',
                        foreignField: '_id',
                        as: 'base_currency_data'
                    }
                },
                { $unwind: '$base_currency_data' },
            
                {
                    $lookup: {
                        from: 'currencies',
                        localField: 'quoteObjId',
                        foreignField: '_id',
                        as: 'quote_currency_data'
                    }
                },
                { $unwind: '$quote_currency_data' },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'userObjId',
                        foreignField: '_id',
                        as: 'user_data'
                    }
                },
                { $unwind: '$user_data' },
                {
                    $addFields: {
                        base_currency_short_name: '$base_currency_data.short_name',
                        quote_currency_short_name: '$quote_currency_data.short_name',
                        user_email : '$user_data.emailId',
                        user_mobileNumber: '$user_data.mobileNumber'
                    }
                },
                
                {
                    $project: {
                        base_currency_data: 0,
                        quote_currency_data: 0,
                        baseObjId: 0,
                        quoteObjId: 0,
                        user_data: 0,
                        userObjId: 0
                    }
                }
            ]);

            const orderIds = orders.map(order => order._id);
            await Orderbook.deleteMany({ _id: { $in: orderIds } })
    
            return res.status(200).json({
                success: true,
                message: "All Open orders deleted successfully",
                data: orders,
                total_count: totalCount
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },

    delete_single_open_order_admin: async (req, res) => {
        try {
            const { id } = req.params;
            const orderId = new ObjectId(id)
            
            let data = await Orderbook.findByIdAndDelete({_id : orderId});
            
            return res.status(200).json({
                success: true,
                message: "Single Open order deleted successfully",
                data: data,
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },


     // Helper function to cancel a single order
     cancelAllOrders: async (req, res) => {
        try {
            const { userId } = req.user;
            
            const cancelOrder = async (orderId, userId, side) => {
                try {
                    // Find the order and check if it's still eligible for cancellation
                    const order = await Orderbook.findOne({
                        _id: new ObjectId(orderId),
                        user_id: userId,
                        status: { $nin: ["FILLED", "CANCELLED"] }
                    });
            
                    if (!order) {
                        return { success: false, message: "Order already executed" };
                    }
            
                    // Mark the order as cancelled
                    await Orderbook.updateOne(
                        { _id: new ObjectId(orderId) },
                        { $set: { status: 'CANCELLED', remaining: 0 } }
                    );
            
                    // Update wallet balances
                   

                    if(side === "BUY"){
                        const amountToUnlock = order.price * order.remaining;
                        
                    
                        await Wallets.updateOne(
                        { user_id: userId, currency_id: order.quote_currency_id },
                        { $inc: { locked_balance: -amountToUnlock, balance: amountToUnlock } }
                    );
                }

                if(side === "SELL"){
                    const amountToUnlock = order.quantity;
                   
                    await Wallets.updateOne(
                        { user_id: userId, currency_id: order.base_currency_id },
                        { $inc: { locked_balance: -amountToUnlock, balance: amountToUnlock } }
                    );
                }
                    // Add any additional logic here based on your requirements
            
                    return { success: true, message: "Order cancelled successfully" };
                            
                } catch (error) {
                    throw new Error(error.message);
                }
            };
            
            // Find all orders for the user that are not filled or already cancelled
            const ordersToCancel = await Orderbook.find({
                user_id: userId,
                status: { $nin: ["FILLED", "CANCELLED"] }
            });
            
            if (ordersToCancel.length === 0) {
                return res.status(200).json({
                    success: true,
                    message: "No eligible orders to cancel",
                    data: [],
                });
            }
            
            // Iterate through each order and cancel it
            const cancelResults = [];
            for (const order of ordersToCancel) {
                const result = await cancelOrder(order._id, order.user_id,order.side);
                cancelResults.push(result);
            }
            
            return res.status(200).json({
                success: true,
                message: "All eligible orders cancelled successfully",
                data: cancelResults,
            });
    
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Error cancelling orders",
                error: error.message,
                data: [],
            });
        }
    },

    cancel_order: async(req, res) => {
        try {
            let { order_id } = req.body
            const { userId } = req.user
            // first check if order is still available
            let exists = await Orderbook.findOne({$and: [{_id: new ObjectId(order_id)}, { status: { $ne: "FILLED" } }, { status: { $ne: "CANCELLED" } }]});
            
            if(exists === null) {
                return res.status(200).json({
                    success: true,
                    message: "order already executed",
                    data: [],
                });
            } else {
                
                // eventEmitter.emit('globalupdate')
                if(exists.side == 'BUY') {
                    // First mark the order as cancelled
                    let mark = await Orderbook.updateOne(
                        {_id: new ObjectId(order_id)},
                        {
                            $set: {
                                status: 'CANCELLED',
                                remaining: 0
                            }
                        },
                        { upsert: true }
                    )
                    if(mark.upsertedCount > 0 || mark.modifiedCount > 0) {
                        
                        let amount = exists.price * exists.remaining;
                        

                        // we have to reduce locked balance of this currency and increase balance in users wallet
                        let wallet = await Wallets.updateOne(
                            {$and: [{ user_id: userId },{currency_id: exists.quote_currency_id}]},
                            {
                                $inc: {
                                    locked_balance: -amount,
                                    balance: amount
                                }
                            }
                        )
                        
                        if(wallet.upsertedCount > 0 || wallet.modifiedCount > 0){
                            return res.status(200).json({
                                success: true,
                                message: "order cancelled",
                                data: [],
                            });
                        } else {
                            return res.status(406).json({
                                success: false,
                                message: "some error occured while transferring the money",
                                data: [],
                            });
                        }

                    } else {
                        return res.status(406).json({
                            success: false,
                            message: "some error occured while cancelling the order",
                            data: [],
                        });
                    }
                } else {
                    // First mark the order as cancelled
                    let mark = await Orderbook.updateOne(
                        {_id: new ObjectId(order_id)},
                        {
                            $set: {
                                status: 'CANCELLED',
                                remaining: 0
                            }
                        },
                        { upsert: true }
                    )
                    if(mark.upsertedCount > 0 || mark.modifiedCount > 0) {
                        
                        let amount = exists.remaining
                        

                        // we have to reduce locked balance of this currency and increase balance in users wallet
                        let wallet = await Wallets.updateOne(
                            {$and: [{ user_id: userId },{currency_id: exists.base_currency_id}]},
                            {
                                $inc: {
                                    locked_balance: -amount,
                                    balance: amount
                                }
                            }
                        )
                        
                        if(wallet.upsertedCount > 0 || wallet.modifiedCount > 0){
                            return res.status(200).json({
                                success: true,
                                message: "order cancelled",
                                data: [],
                            });
                            
                        } else {
                            return res.status(406).json({
                                success: false,
                                message: "some error occured while transferring the money",
                                data: [],
                            });
                        }

                    } else {
                        return res.status(406).json({
                            success: false,
                            message: "some error occured while cancelling the order",
                            data: [],
                        });
                    }
                }
            }
        } catch (error) {
            return res
                .status(500)
                .json({ success: false, message: error.message, data: [] });
        }
    },

    find_trades_by_order_id: async(req, res) => {
        try {
            const { order_id } = req.body;
            let find = await Exchange.find({order_id: order_id});

            if(find.length > 0) {
                return res.status(200).json({success: true, message: 'trades fetched successfully', data: find})
            } else {
                return res.status(200).json({success: true, message: 'trades fetched successfully', data: []})
            }
        } catch (error) {
            return res.status(500).json({success: false, message: error.message, data: []})
        }
    },

    get_negative_orders: async(req, res) => {
        try {
            let list = await Orderbook.aggregate([
                { $match: {remaining: {$lt: 0}}},
                { $addFields: { userObjId: { $toObjectId: "$user_id" } } },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'userObjId',
                        foreignField: '_id',
                        as: 'data'
                    }
                },
                { $unwind: "$data"},
                { 
                    $addFields: {
                        "First Name": "$data.firstName",
                        "Last Name": "$data.lastName",
                        "Email Id": "$data.emailId",
                        "Mobile Number": "$data.mobileNumber",
                        "User Id": "$data._id"
                    }
                },
                { $project: {data: 0}}
            ]);
            return res.status(200).json({success: true, message: 'Negative orders fetched', data: list})
        } catch (error) {
            return res.status(500).json({success: false, message: error.message, data: []})
        }
    },

    get_user_trade_history: async(req, res) => {
        try {
            const { base_currency_id, quote_currency_id } = req.body;
            const { userId } = req.user;

            let orders = await Exchange.find({
                $and: [
                    { user_id: userId },
                    { base_currency_id: base_currency_id },
                    { quote_currency_id: quote_currency_id },
                ],
            });
            await update_activity(req, res, userId);
            return res.status(200).json({
                    success: true,
                    message: "Trade history fetched successfully",
                    data: orders,
            });
        } catch (error) {
            return res
                .status(500)
                .json({ success: false, message: error.message, data: [] });
        }
    },
    };