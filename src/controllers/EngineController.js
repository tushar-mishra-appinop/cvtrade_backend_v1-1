const Orderbook = require('../models/Orderbook')
const Admin = require('../models/Commission');
const Exchange = require('../models/Exchange');
const Tickers = require('../models/Ticker')
const Wallets = require('../models/Wallets');
const Pairs = require('../models/Pairs')
const WalletTransaction = require('../models/Transaction');
const Users = require('../models/Users');
const { cache, setDetails } = require('../middleware/Redis')
const { PROJECT_NAME } = process.env;


module.exports = {
    // Find All Pending Order BUY and SELL
    pending_orders_fifo: async (req, res) => {
        try {
            let orders = await Orderbook.find({ $and: [{ status: { $ne: "FILLED" } }, { status: { $ne: "CANCELLED" } }] }).sort({ createdAt: -1 });
            if (orders.length > 0) {
                return orders;
            } else {
                return []
            }
        } catch (error) {
            throw Error(error.message)
        }
    },

    both_currency_buy_orders_cache: async (base_currency_id, quote_currency_id, updatecache) => {
        try {
            // if(base_currency_id == undefined || quote_currency_id == undefined) return []
            // const orders = await cache(`${base_currency_id}_${quote_currency_id}_buy`)
            // // console.log(orders,"check_orders___*****__");
            // if (orders) {
            //     return orders
            // } else {
            let data = await module.exports.both_currency_buy_orders(base_currency_id, quote_currency_id)
            return data;
            // }
        } catch (error) {
            console.log(error)
        }
    },

    // Find Pending sell Order of Base Currency Id and quote currency Id
    both_currency_sell_orders_cache: async (base_currency_id, quote_currency_id, updatecache) => {
        try {
            // if(base_currency_id == undefined|| quote_currency_id == undefined) return []
            // const orders = await cache(`${PROJECT_NAME}_${base_currency_id}_${quote_currency_id}_sell`)
            // if (orders) {
            //     return orders;
            // } else {
            let data = await module.exports.both_currency_sell_orders(base_currency_id, quote_currency_id)
            return data;
            // }
        } catch (error) {
            console.log(error)
        }
    },

    recent_trade_cached_data: async (base_currency_id, quote_currency_id) => {
        try {
            // let trades = await cache(`${PROJECT_NAME}_${base_currency_id}_${quote_currency_id}_recenttrade`)
            // if (trades) {
            //     return trades
            // } else {
            let data = await module.exports.recent_trade(base_currency_id, quote_currency_id)
            // console.log(data,"in_testing trading ");
            return data;
            // }
        } catch (error) {
            console.log(error)
        }
    },

    pending_orders_lifo: async (req, res) => {
        try {
            let orders = await Orderbook.find({ $and: [{ status: { $ne: "FILLED" } }, { status: { $ne: "CANCELLED" } }] }).sort({ createdAt: -1 });
            if (orders.length > 0) {
                return orders;
            } else {
                return []
            }
        } catch (error) {
            throw Error(error.message)
        }
    },

    // Find Pending Order of Base Currency Id
    base_currency_orders: async (base_currency_id) => {
        try {
            let orders = await Orderbook.find({
                $and: [
                    { status: { $ne: "FILLED" } },
                    { status: { $ne: "CANCELLED" } },
                    { base_currency_id: base_currency_id },
                ],
            });
            if (orders.length > 0) {
                return orders;
            } else {
                return []
            }
        } catch (error) {
            throw Error(error.message)
        }
    },

    // Find Pending sell Order of Base Currency Id and quote currency Id
    both_currency_sell_orders: async (base_currency_id, quote_currency_id) => {
        try {
            const orders = await Orderbook.find({
                $and: [
                    { status: { $ne: "FILLED" } },
                    { status: { $ne: "CANCELLED" } },
                    { side: 'SELL' },
                    { base_currency_id: base_currency_id },
                    { quote_currency_id: quote_currency_id },
                ],
            }).sort({ price: 1 });
            if (orders.length > 0) {
                const mergedOrdersMap = {};

                orders.forEach((order) => {
                    const key = `${order.price}`;

                    if (mergedOrdersMap[key]) {
                        // An order with the same price exists, so update it
                        mergedOrdersMap[key].remaining += order.remaining;
                    } else {
                        // No existing order with the same price, so add a new entry
                        mergedOrdersMap[key] = order;
                    }
                });

                // Get the merged orders as an array
                const mergedOrders = Object.values(mergedOrdersMap);

                // Sort the merged orders based on latest createdAt and price
                // mergedOrders.sort((a, b) => {
                //     if (a.createdAt.getTime() === b.createdAt.getTime()) {
                //         return b.price - a.price;
                //     }
                //     return b.createdAt.getTime() - a.createdAt.getTime();
                // });

                const limitedData = mergedOrders
                let newArray = limitedData.sort((a, b) => {
                    return b.price - a.price
                });
                newArray.reverse()
                newArray.slice(0, 50)
                await setDetails(`${PROJECT_NAME}_${base_currency_id}_${quote_currency_id}_sell`, newArray, 1900)
                // console.log(newArray, "output data newArray")
                return newArray
            } else {
                await setDetails(`${PROJECT_NAME}_${base_currency_id}_${quote_currency_id}_sell`, [], 1900)
                return [];
            }
        } catch (error) {
            throw Error(error.message);
        }
    },

    // Find Pending sell Order of Base Currency Id and quote currency Id
    both_currency_sell_orders_engine: async (base_currency_id, quote_currency_id) => {
        try {
            let orders = await Orderbook.find({
                $and: [
                    { status: { $ne: "FILLED" } },
                    { status: { $ne: "CANCELLED" } },
                    { side: 'SELL' },
                    { base_currency_id: base_currency_id },
                    { quote_currency_id: quote_currency_id },
                    { remaining: { $gt: 0 } },
                ],
            }).sort({ price: 1 });
            if (orders.length > 0) {
                return orders;
            } else {
                return []
            }
        } catch (error) {
            throw Error(error.message)
        }
    },

    // Find Pending buy Order of Base Currency Id and quote currency Id
    both_currency_buy_orders: async (base_currency_id, quote_currency_id) => {
        try {
            const orders = await Orderbook.find({
                $and: [
                    { status: { $ne: "FILLED" } },
                    { status: { $ne: "CANCELLED" } },
                    { side: 'BUY' },
                    { base_currency_id: base_currency_id },
                    { quote_currency_id: quote_currency_id },
                    { remaining: { $gt: 0 } }
                ],
            }).sort({ price: 1 });

            if (orders.length > 0) {
                const mergedOrdersMap = {};

                orders.forEach((order) => {
                    const key = `${order.price}`;

                    if (mergedOrdersMap[key]) {
                        // An order with the same price exists, so update it
                        mergedOrdersMap[key].remaining += order.remaining;
                    } else {
                        // No existing order with the same price, so add a new entry
                        mergedOrdersMap[key] = order;
                    }
                });

                // Get the merged orders as an array
                const mergedOrders = Object.values(mergedOrdersMap);

                // Sort the merged orders based on latest createdAt and price
                mergedOrders.sort((a, b) => {
                    if (a.createdAt.getTime() === b.createdAt.getTime()) {
                        return b.price - a.price;
                    }
                    return b.createdAt.getTime() - a.createdAt.getTime();
                });

                const limitedData = mergedOrders
                let newArray = limitedData.sort((a, b) => {
                    return b.price - a.price
                });
                newArray = newArray.slice(0, 50)
                await setDetails(`${PROJECT_NAME}_${base_currency_id}_${quote_currency_id}_buy`, newArray, 1900)
                return newArray
            } else {
                await setDetails(`${PROJECT_NAME}_${base_currency_id}_${quote_currency_id}_buy`, [], 1900)
                return [];
            }
        } catch (error) {
            throw Error(error.message);
        }
    },

    // Find Pending buy Order of Base Currency Id and quote currency Id
    both_currency_buy_orders_engine: async (base_currency_id, quote_currency_id) => {
        try {
            let orders = await Orderbook.find({
                $and: [
                    { status: { $ne: "FILLED" } },
                    { status: { $ne: "CANCELLED" } },
                    { side: 'BUY' },
                    { base_currency_id: base_currency_id },
                    { quote_currency_id: quote_currency_id },
                    { remaining: { $gt: 0 } },
                ],
            }).sort({ price: -1 });
            if (orders.length > 0) {
                return orders;
            } else {
                return []
            }
        } catch (error) {
            throw Error(error.message)
        }
    },

    // Find Pending Sell Order of Base Currency Id
    base_currency_sell_orders: async (base_currency_id) => {
        try {
            let orders = await Orderbook.find({
                $and: [
                    { side: "SELL" },
                    { status: { $ne: "FILLED" } },
                    { status: { $ne: "CANCELLED" } },
                    { base_currency_id: base_currency_id },
                ],
            });
            if (orders.length > 0) {
                return orders;
            } else {
                return []
            }
        } catch (error) {
            throw Error(error.message)
        }
    },

    // Find Pending Order of Quote Currency Id
    quote_currency_orders: async (quote_currency_id) => {
        try {
            let orders = await Orderbook.find({
                $and: [
                    { status: { $ne: "FILLED" } },
                    { status: { $ne: "CANCELLED" } },
                    { quote_currency_id: quote_currency_id },
                ],
            });
            if (orders.length > 0) {
                return orders;
            } else {
                return []
            }
        } catch (error) {
            throw Error(error.message)
        }
    },

    // Find Pending Buy Order of Quote Currency Id
    quote_currency_sell_orders: async (quote_currency_id) => {
        try {
            let orders = await Orderbook.find({
                $and: [
                    { side: 'SELL' },
                    { status: { $ne: "FILLED" } },
                    { status: { $ne: "CANCELLED" } },
                    { quote_currency_id: quote_currency_id },
                ],
            });
            if (orders.length > 0) {
                return orders;
            } else {
                return []
            }
        } catch (error) {
            throw Error(error.message)
        }
    },

    // This will find pending sell order
    pending_sell_orders_fifo: async () => {
        try {
            let orders = await Orderbook.find({
                $and: [{ side: "SELL" }, { status: { $ne: "FILLED" } }, { status: { $ne: "CANCELLED" } }],
            }).sort({ quantity: -1, createAt: 1 });
            if (orders.length > 0) {
                return orders
            } else {
                return []
            }
        } catch (error) {
            throw Error(error.message)
        }
    },

    // This will find pending buy order
    pending_buy_orders_fifo: async () => {
        try {
            let orders = await Orderbook.find({
                $and: [{ side: "BUY" }, { status: { $ne: "FILLED" } }, { status: { $ne: "CANCELLED" } }],
            }).sort({ quantity: 1, createdAt: 1 });
            if (orders.length > 0) {
                return orders;
            } else {
                return []
            }
        } catch (error) {
            throw Error(error.message);
        }
    },

    // This is Mark the transaction as FILLED, PENDING, PARTIALLY EXECUTED, CANCELLED
    mark_order: async (order_id, filled, remaining, status) => {
        try {
            let mark = await Orderbook.updateOne(
                { _id: order_id },
                {
                    $inc: {
                        filled: parseFloat(filled),
                        remaining: parseFloat(remaining),
                    },
                    $set: {
                        status: status,
                    }
                },
                { upsert: true }
            );
            if (mark.upsertedCount > 0 || mark.modifiedCount > 0) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            throw Error(error.message)
        }
    },

    // This will create a transaction of admins commission
    admin_commission: async (from_user, amount, fee, fee_type, percentage, currency_id, quantity) => {
        try {
            let commission = await Admin.create({ currency_id, from_user, amount, fee, fee_type, percentage, quantity });
            if (commission) {
                return true
            } else {
                return false;
            }
        } catch (error) {
            throw Error(error.message)
        }
    },

    // This will create a transaction if trade successfully happens
    create_trade_transaction: async (transaction) => {
        try {
            let create = await Exchange.create(transaction);
            if (create) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            throw Error(error.message);
        }
    },

    // This will calculate maker fee
    calculate_maker_fee: async (price, quantity, fee) => {
        try {
            // Seller is providing liquidity to the exchange so fee will be maker fee
            let calc = price * quantity
            let fees = calc * fee / 100
            let admin_quantity = fees / price;
            let amount = calc - fees;
            return { amount: amount, fee: fees, type: 'maker_fee', admin_quantity: admin_quantity };
        } catch (error) {
            throw Error(error.message);
        }
    },

    // This will calculate taker fee
    calculate_taker_fee: async (price, quantity, fee) => {
        try {
            // Buyer is taking liquidity from the exchange so fee will be taker fee
            let calc = price * quantity
            let fees = calc * fee / 100
            let admin_quantity = fees / price;
            let amount = calc - fees
            return { amount: amount, fee: fees, type: 'taker_fee', admin_quantity: admin_quantity };
        } catch (error) {
            throw Error(error.message)
        }
    },

    update_locked_balance: async (user_id, currency_id, locked_amount) => {
        try {
            let wallet = await Wallets.updateOne(
                {
                    $and: [
                        { user_id: user_id },
                        { currency_id: currency_id }
                    ]
                },
                {
                    $inc: {
                        locked_balance: parseFloat(locked_amount)
                    }
                },
                { upsert: true }
            )
            if (wallet.upsertedCount > 0 || wallet.modifiedCount > 0) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            throw Error(error.message)
        }
    },

    update_balance: async (user_id, currency_id, amount) => {
        try {
            let wallet = await Wallets.updateOne(
                {
                    $and: [
                        { user_id: user_id },
                        { currency_id: currency_id }
                    ]
                },
                {
                    $inc: {
                        balance: parseFloat(amount)
                    }
                },
                { upsert: true }
            )
            if (wallet.upsertedCount > 0 || wallet.modifiedCount > 0) {
                return true;
            } else {
                return false;
            }
        } catch (error) {
            throw Error(error.message)
        }
    },

    create_wallet_transaction: async (transaction) => {
        try {
            let create = await WalletTransaction.create(transaction);
            if (create) {
                return true
            } else {
                return false
            }
        } catch (error) {
            throw Error(error.message);
        }
    },

    user_details: async (id) => {
        try {
            let user = await Users.findOne({ _id: id });
            if (user) {
                return user;
            } else {
                return false;
            }
        } catch (error) {
            throw Error(error.message);
        }
    },

    recent_trade: async (base_currency_id, quote_currency_id) => {
        try {
            // console.log(base_currency_id,quote_currency_id,"data testing");
            let trades = await Exchange.find({ base_currency_id: base_currency_id, quote_currency_id: quote_currency_id }).sort({ createdAt: -1 }).skip(0).limit(50);
            if (trades != []) {
                await setDetails(`${PROJECT_NAME}_${base_currency_id}_${quote_currency_id}_recenttrade`, trades, 1900)
                return trades
            } else {
                await setDetails(`${PROJECT_NAME}_${base_currency_id}_${quote_currency_id}_recenttrade`, [], 1900)
                return []
            }
        } catch (error) {
            throw Error(error.message);
        }
    },
    find_volume: async (base_currency_id, quote_currency_id) => {
        try {

            const trades = await Exchange.find({
                base_currency_id: base_currency_id,
                quote_currency_id: quote_currency_id,
                date: { $gte: new Date(new Date() - 24 * 60 * 60 * 1000) },
            });

            // Calculate the sum of quantity for these trades
            const totalQuantity = trades.reduce((sum, trade) => sum + trade.quantity * 2, 0);
            return totalQuantity;
        } catch (error) {
            throw new Error(error.message);
        }
    },



    recent_trade_price: async (base_currency_id, quote_currency_id, currentTime) => {
        function getStartOfMinute(timestamp) {
            const date = new Date(timestamp);
            date.setSeconds(0, 0);
            return date.getTime();
        };
        try {
            let trades = await Exchange.find(
                {
                    $and: [
                        { base_currency_id: base_currency_id },
                        { quote_currency_id: quote_currency_id },
                        { createdAt: { $gte: (getStartOfMinute(currentTime)) } }
                    ]
                }
            ).sort({ createdAt: -1 });
            return trades;
        } catch (error) {
            throw Error(error.message);
        }
    },

    // How many people want to sell the currency
    total_supply: async (base_currency_id) => {
        try {
            let supply = await Orderbook.aggregate([
                { $match: { $and: [{ base_currency_id: base_currency_id }, { side: 'SELL' }, { status: { $ne: "FILLED" } }, { status: { $ne: "CANCELLED" } }] } },
                {
                    $group:
                    {
                        _id: { day: { $dayOfYear: "$date" }, year: { $year: "$date" } },
                        total_quantity: { $sum: "$quantity" },
                    }
                }
            ])
            if (supply.length > 0) {
                return supply[0].total_quantity;
            } else {
                return 1;
            }
        } catch (error) {
            throw Error(error.message);
        }
    },

    // How many people want to buy the currency
    total_demand: async (base_currency_id) => {
        try {
            let demand = await Orderbook.aggregate([
                { $match: { $and: [{ base_currency_id: base_currency_id }, { side: 'BUY' }, { status: { $ne: "FILLED" } }, { status: { $ne: "CANCELLED" } }] } },
                {
                    $group:
                    {
                        _id: { day: { $dayOfYear: "$date" }, year: { $year: "$date" } },
                        total_quantity: { $sum: "$quantity" },
                    }
                }
            ])
            if (demand.length > 0) {

                return demand[0].total_quantity;
            } else {
                return 1;
            }
        } catch (error) {
            throw Error(error.message);
        }
    },

    // total circulating volume
    circulating_volume: async (base_currency_id) => {
        try {
            let demand = await Orderbook.aggregate([
                { $match: { $and: [{ base_currency_id: base_currency_id }, { status: { $ne: "FILLED" } }, { status: { $ne: "CANCELLED" } }] } },
                {
                    $group:
                    {
                        _id: { day: { $dayOfYear: "$date" }, year: { $year: "$date" } },
                        total_quantity: { $sum: "$quantity" },
                    }
                }
            ])
            // console.log(demand, " : demand")
            if (demand.length > 0) {
                return demand[0].total_quantity;
            } else {
                return 1;
            }
        } catch (error) {
            throw Error(error.message);
        }
    },


    // Get the ticker of a pair
    ticker1: async (base_currency_id, quote_currency_id) => {
        try {
            let trades = await Exchange.find(
                {
                    $and: [
                        { base_currency_id: base_currency_id },
                        { quote_currency_id: quote_currency_id },
                        { createdAt: { $gte: new Date(Date.now() - 60 * 1000) } } // Filter for last one minute
                    ]
                }
            ).sort({ createdAt: -1 });
            let price = await Pairs.find({ available: "LOCAL", base_currency: "CVT", quote_currency: "USDT" });
            // console.log(trades,"recent");
            if (trades.length > 0) {
                // console.log(trades[0],"trade__**__");
                const prices = trades.map((trade) => trade.price);
                const high = Math.max(...prices);
                const low = Math.min(...prices);
                const open = coins.sell_price;
                const price2 = trades[0].price
                const close = trades[trades.length - 1].price;
                const volume = trades[0].quantity
                return { high: high, low: low, open: open, close: close, price: price2, volume: volume };
            } else {
                return { high: price, low: price, open: price, close: price, price: price, volume: 0 };
            }
        } catch (error) {
            console.log(error, "here is my error");
        }
    },
    ticker: async (base_currency_id, quote_currency_id, cursor, limit) => {
        try {
            // console.log(cursor,"cursor");
            let ticker = await Tickers.find({ $and: [{ base_currency_id: base_currency_id }, { quote_currency_id: quote_currency_id }] }).sort({ createdAt: -1 }).limit(1)

            if (ticker.length > 0) {
                return ticker[0];
            } else {
                return [];
            }
        } catch (error) {
            throw Error(error.message);
        }
    },

    // Open orders for a user
    open_order: async (user_id, base_currency_id, quote_currency_id) => {
        try {
            let orders = await Orderbook.find({
                $and: [
                    { user_id, user_id },
                    { base_currency_id: base_currency_id },
                    { quote_currency_id: quote_currency_id },
                    { status: { $ne: "FILLED" } },
                    { status: { $ne: "CANCELLED" } },
                ],
            });

            return orders;
        } catch (error) {
            throw Error(error.message);
        }
    },
    hours24Changes: async (base_currency_id, quote_currency_id) => {
        try {
            // console.log(base_currency_id,quote_currency_id,"here is the password for admin for data___**__");
            const Pairst = await Pairs.findOne({ base_currency_id: quote_currency_id, quote_currency_id: base_currency_id });
            // console.log(Pairst,"bhaicheck");
            if (Pairst.available === 'GLOBAL') return []; // Exit if pairs are not available locally

            // Get the current date
            const currentDate = new Date();
            // console.log(currentDate, "CURRENT DATE");
            currentDate.setHours(0, 0, 0, 0);
            const startTimeEpochSeconds = Math.floor(currentDate.getTime() / 1000);
            const currentTimeEpochSeconds = Math.floor(Date.now() / 1000);
            // console.log(startTimeEpochSeconds, "Start Time");
            // console.log(currentTimeEpochSeconds, "Current Time");

            let coins = await Pairs.find({ available: "LOCAL", base_currency_id: quote_currency_id, quote_currency_id: base_currency_id });
            // console.log(coins[0], "Data log of coins")
            let tradescurrentmin = await Exchange.find(
                {
                    $and: [
                        { base_currency_id: base_currency_id },
                        { quote_currency_id: quote_currency_id },
                        { createdAt: { $gte: new Date(Date.now() - 60 * 1000) } } // Filter for last one minute
                    ]
                }
            )
            console.log(tradescurrentmin, "Data of trading Of Past 1 MIN");

            const calculateOHLC = async (trades, price) => {
                // console.log(trades,"recent");
                if (trades.length > 0) {
                    // console.log(trades[0],"trade__**__");
                    const prices = trades.map((trade) => trade.price);
                    const high = Math.max(...prices);
                    const low = Math.min(...prices);
                    const open = price;
                    const price2 = trades[0].price
                    const close = trades[trades.length - 1].price;
                    const volume = trades[0].quantity
                    return { high: high, low: low, open: open, close: close, price: price2, volume: volume };
                } else {
                    return { high: price, low: price, open: price, close: price, price: price, volume: 0 };
                }
            }
            const dataohc = await calculateOHLC(tradescurrentmin, coins[0].sell_price)

            console.log(dataohc, "ohlc");

            // Fetch ticker data from 12 AM to the current time
            // console.log(startTimeEpochSeconds, currentTimeEpochSeconds, "EPOCH TIMINGS");
            const trades = await Exchange.find({
                base_currency_id: quote_currency_id,
                quote_currency_id: base_currency_id,
                time1: { $gte: startTimeEpochSeconds, $lte: currentTimeEpochSeconds }
            });
            // console.log(trades,"testing trades");

            if (trades.length > 0) {
                const prices = trades.map((trade) => trade.price);
                // console.log(prices,"prics");
                const high = Math.max(...prices);
                const low = Math.min(...prices);
                const volume = trades.reduce((acc, trade) => acc + trade.quantity * 2, 0);
                // console.log(volume,"volumecheck");

                const priceAtStartOfDay = trades[trades.length - 1].price;
                console.log("priceAtStartOfDay:", priceAtStartOfDay);
                // console.log(priceAtStartOfDay,dataohc.close,"priceAtStartOfDay");
                // const currentPrice = trades[trades.length - 1].price;
                const currentPrice = trades[0].price;
                console.log(currentPrice, "************* price");
                const percentageChange = ((currentPrice - priceAtStartOfDay) / priceAtStartOfDay) * 100;
                console.log("percentageChange:", percentageChange);
                const change24hour = (currentPrice - priceAtStartOfDay);
                console.log("change24hour:", change24hour);
                const updateResult = await Pairs.updateOne(
                    {
                        base_currency_id: quote_currency_id,
                        quote_currency_id: base_currency_id,
                    },
                    {
                        $set: {
                            buy_price: dataohc.close,
                            sell_price: currentPrice,
                            volume: volume,
                            high,
                            low,
                            open: priceAtStartOfDay,
                            close: currentPrice,
                            change: percentageChange, // Absolute change
                            change_percentage: percentageChange,
                            change_24hour: change24hour,
                            available: 'LOCAL',
                        },
                    },
                    { upsert: true }
                );

                const updatedPair = await Pairs.findOne({
                    base_currency_id: quote_currency_id,
                    quote_currency_id: base_currency_id,
                });

                return updatedPair;
            } else {
                return []; // No trades found
            }
        } catch (error) {
            return []
        }
    },


}