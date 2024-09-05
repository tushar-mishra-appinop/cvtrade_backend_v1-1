const Wallets = require('../models/Wallets');
const Currency = require('../models/Currency')
const Address = require('../utils/GenerateAddress')
const Users = require('../models/Users')
const Pairs = require('../models/Pairs');
const UserAddress = require('../models/UserAddresses');
const Otps = require('../models/Otps')
const WalletTransaction = require('../models/WalletTransaction')
const axios = require('axios')
const crypto = require('crypto');
// const { upiValidation } = require('../utils/Utils');
const { errorHandler } = require('../utils/CustomError');
const { address_validation } = require('../utils/Utils')
const { verify_bep20_token_deposit } = require('../utils/VerifyDeposit');
const { ObjectId } = require('mongodb');
const UserBankDetails = require('../models/UserBankDetails');
// const CurrencyController = require('./CurrencyController');
const { email_marketing } = require('../utils/Marketing');
const { WITHDRAWAL_USERNAME, WITHDRAWAL_PASSWORD, WITHDRAWAL_GRANT_TYPE, RIK_WITHDRAWAL_TOKEN_URL, RIK_WITHDRAWAL_URL, TBT_WITHDRAWAL_URL, USDT_WITHDRAWAL_URL, TRX_WITHDRAWAL_URL } = process.env
// const { CRYPTOCOMPARE } = process.env;
module.exports = {
    create_wallet: async (req, res) => {
        try {

            const { userId } = req.user;
            let coins = await Currency.find();
            // console.log(coins, ": COINNNNNNNNNNN")        
            for (let i = 0; i < coins.length; i++) {
                let wallet = {}
                wallet.user_id = userId;
                wallet.currency = coins[i].name
                wallet.currency_id = coins[i]._id
                wallet.chain = coins[i].chain
                wallet.short_name = coins[i].short_name
                wallet.contract_address = coins[i].contract_address
                wallet.icon_path = coins[i].icon_path

                let exists = await Wallets.find({ $and: [{ user_id: userId }, { currency_id: wallet.currency_id }] })
                if (exists.length > 0) {
                    continue
                } else {
                    wallet.address = ''
                    wallet.private_key = ''
                }

                let wallet_create = await Wallets.create(wallet);
            }

            return 1
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    create_wallet2: async (userId) => {
        try {

            // const { userId } = req.user;
            let coins = await Currency.find();
            // console.log(coins, ": COINNNNNNNNNNN")        
            for (let i = 0; i < coins.length; i++) {
                let wallet = {}
                wallet.user_id = userId;
                wallet.currency = coins[i].name
                wallet.currency_id = coins[i]._id
                wallet.chain = coins[i].chain
                wallet.short_name = coins[i].short_name
                wallet.contract_address = coins[i].contract_address
                wallet.icon_path = coins[i].icon_path

                let exists = await Wallets.find({ $and: [{ user_id: userId }, { currency_id: wallet.currency_id }] })
                if (exists.length > 0) {
                    continue
                } else {
                    wallet.address = ''
                    wallet.private_key = ''
                }

                let wallet_create = await Wallets.create(wallet);
            }

            return 1
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    admin_wallet: async (id) => {
        try {

            let coins = await Currency.find();
            for (let i = 0; i < coins.length; i++) {
                let wallet = {}
                wallet.user_id = id;
                wallet.currency = coins[i].name
                wallet.currency_id = coins[i]._id
                wallet.chain = coins[i].chain
                wallet.short_name = coins[i].short_name
                wallet.contract_address = coins[i].contract_address
                wallet.icon_path = coins[i].icon_path
                let exists = await Wallets.find({ $and: [{ _id: id }, { currency_id: wallet.currency_id }] })

                if (exists.length > 0) {
                    continue
                } else {
                    wallet.address = ''
                    wallet.private_key = ''
                }
                await Wallets.create(wallet);
            }
            return 1
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    // get_wallet: async(req, res) => {
    //     try {
    //         const { userId } = req.user;

    //         let data = await Wallets.find({user_id: userId})
    //         if(data.length > 0) {
    //             return res.status(200).json({success: true, message: 'wallet details fetched successfully', data: data})
    //         } else {
    //             return res.status(404).json({success: true, message: 'no wallet found for this user', data: []})
    //         }
    //     } catch (error) {
    //         return res.status(500).json({success: false, message: error.message, data: []})
    //     }
    // },

    get_wallet: async (req, res) => {
        try {
            const { userId } = req.user;
            let coins = await Currency.find();

            for (let i = 0; i < coins.length; i++) {
                let wallet = {}
                wallet.user_id = userId;
                wallet.currency = coins[i].name
                wallet.currency_id = coins[i].id
                wallet.chain = coins[i].chain
                wallet.short_name = coins[i].short_name
                wallet.icon_path = coins[i].icon_path

                let exists = await Wallets.findOne({ user_id: userId, currency_id: wallet.currency_id })
                if (exists) {
                    continue
                } else {
                    wallet.address = ''
                    wallet.private_key = ''
                }

                await Wallets.create(wallet);
            }

            let data = await Wallets.aggregate([
                { $match: { user_id: userId } },
                {
                    $lookup: {
                        from: 'currency_pairs',
                        let: { short_name: '$short_name' },
                        pipeline: [
                            { $match: { $expr: { $and: [{ $eq: ['$base_currency', '$$short_name'] }, { $eq: ['$quote_currency', 'USDT'] }] } } }
                        ],
                        as: 'currency_info'
                    }
                },
                {
                    $addFields: {
                        image_path: { $arrayElemAt: ['$currency_info.icon_path', 0] },
                        price: { $arrayElemAt: ['$currency_info.buy_price', 0] },
                        change: { $arrayElemAt: ['$currency_info.change', 0] }
                    }
                },
                { $project: { currency_info: 0 } } // Exclude the currency_info field from the final output
            ]);

            if (data.length > 0) {
                return res.status(200).json({
                    success: true,
                    message: 'wallet details fetched successfully',
                    data: data
                });
            } else {
                return res.status(404).json({
                    success: true,
                    message: 'no wallet found for this user',
                    data: []
                });
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },

    p2p_wallet: async (req, res) => {
        try {
            const { userId } = req.user;

            let data = await Currency.aggregate(
                [
                    {
                        $match: {
                            p2p: true
                        }
                    },
                    {
                        $addFields: {
                            id: { $toString: "$_id" }
                        }
                    },
                    {
                        $lookup: {
                            from: "wallets",
                            localField: "id",
                            foreignField: "currency_id",
                            as: "result"
                        }
                    },
                    {
                        $addFields: {
                            result: {
                                $filter: {
                                    input: "$result",
                                    as: "item",
                                    cond: {
                                        $eq: [
                                            "$$item.user_id",
                                            userId
                                        ]
                                    }
                                }
                            }
                        }
                    },
                    {
                        $unwind: {
                            path: "$result"
                        }
                    },
                    {
                        $project: {
                            _id: 1,
                            short_name: "$result.short_name",
                            p2p_locked_balance: "$result.p2p_locked_balance",
                            p2p_balance: "$result.p2p_balance",
                            currency: "$result.currency",
                            icon_path: "$result.icon_path"
                        }
                    }
                ]);

            if (data.length > 0) {
                return res.status(200).json({
                    success: true,
                    message: 'wallet details fetched successfully',
                    data: data
                });
            } else {
                return res.status(404).json({
                    success: true,
                    message: 'no wallet found for this user',
                    data: []
                });
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },

    walletZero: async (req, res) => {
        try {
            let data = await Wallets.updateMany(
                { short_name: { $ne: 'SHIB' } },
                { $set: { balance: 0, locked_balance: 0 } }
            );

            return res.status(200).json({ success: true, message: 'All wallet balances made zero except SHIB!', data: data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },



    update_chain: async (req, res) => {
        try {
            const chainId = "663c9a3b87a593010a6f193a";

            let data = await Wallets.find({ currency_id: chainId });
            const total = await Wallets.countDocuments({ currency_id: chainId });

            if (data.length > 0) {
                for (let wallet of data) {
                    // Check if chain field exists
                    if (wallet.chain) {
                        // Update the chain field
                        wallet.chain = wallet.chain.map(chainName =>
                            chainName === "BEP20(BSC)" ? "BEP20" : chainName
                        );
                        // Save the updated document
                        await wallet.save();
                    }
                }

                // Re-fetch the updated data to send in the response
                data = await Wallets.find({ currency_id: chainId });

                return res.status(200).json({ success: true, message: 'wallet details updated successfully', data: data, count: total })
            } else {
                return res.status(404).json({ success: true, message: 'no wallet found for this user', data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },


    wallet_balance: async (user_id, currency_id) => {
        try {
            if (user_id == undefined) return 0
            let balance = await Wallets.findOne({
                $and: [
                    { user_id: user_id },
                    { currency_id: currency_id }
                ]
            })
            if (balance != null) {
                return balance['balance']
            } else {
                return 0;
            }
        } catch (error) {
            throw await errorHandler(error.message, 500)
        }
    },

    generate_address: async (req, res) => {
        try {
            const { currency_id, chain } = req.body;
            const { userId } = req.user;
            //  const userId = "660a47cc1a7100f39d0ace89"
            let check_type = await Users.findOne({ _id: userId })

            let check = await UserAddress.findOne({ $and: [{ user_id: userId }, { chain: chain }] });
            // console.log(check,"test,");
            if (check != null) {
                return res.status(200).json({ success: true, message: 'address fetched successfully', data: check.address })
            } else {
                if (chain === 'BEP20') {
                    let address = await Address.generateBep20()

                    let newAddress = await UserAddress.updateOne(
                        { user_id: userId, chain: chain },
                        {
                            $set: {
                                address: address.address,
                                private_key: address.privateKey
                            }
                        },
                        { upsert: true }
                    );
                    if (newAddress.upsertedCount > 0 || newAddress.modifiedCount > 0) {
                        return res.status(200).json({ success: true, message: 'Address fetched successfully', data: address.address })
                    } else {
                        return res.status(406).json({ success: false, message: "some error occured while updating address", data: [] })
                    }
                } else if (chain === 'BTC') {
                    let address = await Address.generateBtcAddr()
                    let newAddress = await UserAddress.updateOne(
                        { user_id: userId, currency_id: currency_id, chain: chain },
                        {
                            $set: {
                                address: address.address,
                                private_key: address.privateKey
                            }
                        },
                        { upsert: true }
                    );
                    if (newAddress.upsertedCount > 0 || newAddress.modifiedCount > 0) {
                        return res.status(200).json({ success: true, message: 'Address fetched successfully', data: address.address })
                    } else {
                        return res.status(406).json({ success: false, message: "some error occured while updating address", data: [] })
                    }
                } else if (chain === 'TRC20') {

                    let address = await Address.generateTrxAddress()

                    let newAddress = await UserAddress.updateOne(
                        { user_id: userId, currency_id: currency_id, chain: chain },
                        {
                            $set: {
                                address: address.address['base58'],
                                private_key: address.privateKey
                            }
                        },
                        { upsert: true }
                    );
                    if (newAddress.upsertedCount > 0 || newAddress.modifiedCount > 0) {
                        return res.status(200).json({ success: true, message: 'address fetched successfully', data: address.address['base58'] })
                    } else {
                        return res.status(406).json({ success: false, message: "some error occured while updating address", data: [] })
                    }
                } else if (chain === 'POLYGON_POS') {

                    let address = await Address.generatePolygonAddress()

                    let newAddress = await UserAddress.updateOne(
                        { user_id: userId, currency_id: currency_id, chain: chain },
                        {
                            $set: {
                                address: address.address,
                                private_key: address.privateKey
                            }
                        },
                        { upsert: true }
                    );
                    if (newAddress.upsertedCount > 0 || newAddress.modifiedCount > 0) {
                        return res.status(200).json({ success: true, message: 'address fetched successfully', data: address.address })
                    } else {
                        return res.status(406).json({ success: false, message: "some error occured while updating address", data: [] })
                    }
                } else if (chain === 'ETH' || chain === 'ERC20') {

                    let address = await Address.generateEthAddress()

                    let newAddress = await UserAddress.updateOne(
                        { user_id: userId, currency_id: currency_id, chain: chain },
                        {
                            $set: {
                                address: address.address,
                                private_key: address.privateKey
                            }
                        },
                        { upsert: true }
                    );

                    if (newAddress.upsertedCount > 0 || newAddress.modifiedCount > 0) {
                        return res.status(200).json({ success: true, message: 'address fetched successfully', data: address.address })
                    } else {
                        return res.status(406).json({ success: false, message: "some error occured while updating address", data: [] })
                    }
                } else {
                    return res.status(200).json({ success: false, message: 'deposit is not available in this coin right now', data: [] })
                }
            }

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },
    estimated_portfolio: async (req, res) => {
        try {
            const { userId } = req.user;
            let portfolio = 0;
            let usdPortfolio = 0;
            let obj = {};

            // First we have to check user's currency preference
            let user = await Users.findOne({ _id: new ObjectId(userId) }).select('currency_prefrence');
            const pairs_global = await Pairs.find({ quote_currency: "USDT" });
            // console.log(pairs_global, "pairs global")

            // const INR_local = await Pairs.find({ base_currency: "USDT",quote_currency: "INR" });
            let wallet = await Wallets.find({ user_id: userId });
            let inrbal = 0; //await Wallets.find({ user_id: userId,short_name:"INR"});
            let usdtbal = await Wallets.find({ user_id: userId, short_name: "USDT" });
            const btc_price = await Pairs.find({ base_currency: "BTC", quote_currency: "USDT" });

            for (let i = 0; i < pairs_global.length; i++) {
                let pair = pairs_global[i];
                // console.log(pair);
                let matchWallet = wallet.find(item => item.short_name === pair.base_currency);
                if (matchWallet) {
                    let balanceUsd = pair.buy_price * matchWallet.balance;
                    obj[pair.base_currency] = balanceUsd;
                    usdPortfolio += balanceUsd;
                }

            }
            //  update usdPortfolio 
            usdPortfolio += inrbal / 82;    //inrbal[0].balance/INR_local[0].buy_price;
            obj["INR"] = inrbal / 82;     //inrbal[0].balance/INR_local[0].buy_price;
            obj["USDT"] = usdtbal[0].balance;
            usdPortfolio += usdtbal[0].balance;
            //   console.log(object);
            // console.log(usdPortfolio, "Total USD Portfolio");
            // console.log(obj, "Portfolio Object");
            // convert usdportfolio into btc price according to client requirement


            if (user.currency_prefrence === 'USDT' || user.currency_prefrence === 'BTC' || user.currency_prefrence === 'BNB') {
                for (let i = 0; i < wallet.length; i++) {
                    if (wallet[i].short_name === 'BTC') {
                        // Add BTC balance directly to the portfolio
                        portfolio = usdPortfolio / btc_price[0].buy_price;
                    } else if (wallet[i].short_name === user.currency_prefrence) {
                        // For user's preferred currency (other than BTC), add balance to portfolio
                        portfolio += wallet[i].balance;

                        if (user.currency_prefrence === 'USDT') {
                            portfolio = usdPortfolio;
                        }
                    } else if (user.currency_prefrence === 'BNB') {
                        portfolio = usdPortfolio / 600;
                    }
                }

                return res.status(200).json({
                    success: true,
                    message: `Portfolio fetched successfully for ${user.currency_prefrence}`,
                    currency_data: obj,
                    data: {
                        currencyPrice: portfolio,
                        dollarPrice: usdPortfolio,
                        Currency: user.currency_prefrence
                    }
                });
            } else {
                throw new Error('Invalid currency preference');
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: {} });
        }
    },



    verify_deposits: async (req, res) => {
        try {

            const { userId } = req.user;

            let coins = await Currency.find();
            for await (const coin of coins) {
                let wallet = {}
                wallet.user_id = userId;
                wallet.currency = coin.name
                wallet.currency_id = coin.id
                wallet.chain = coin.chain
                wallet.short_name = coin.short_name
                wallet.icon_path = coin.icon_path

                let exists = await Wallets.find({ $and: [{ user_id: userId }, { currency_id: wallet.currency_id }] })
                if (exists.length > 0) {
                    continue
                } else {
                    wallet.address = ''
                    wallet.private_key = ''
                }
                await Wallets.create(wallet);
            }

            // First we have to find this users wallet 
            let wallets = await Wallets.find({ user_id: userId });
            // console.log(wallets, ": USER WALLET")


            // we have to check for each currency if a new transaction is created or not
            for await (const wallet of wallets) {
                // lets find currency details
                let coin = await Currency.findOne({ _id: wallet.currency_id })
                // console.log(coin, ": coin")
                let chains = wallet.chain;
                for await (const chain of chains) {
                    if (chain === 'BEP20') {

                        // console.log(coin.decimals, ": decimal IN BEP20")
                        let decimals = JSON.parse(coin.decimals)
                        let contract_address = JSON.parse(coin.contract_address)

                        let address = await UserAddress.findOne({ $and: [{ user_id: userId }, { chain: 'BEP20' }] })

                        if (address === null) {
                            continue
                        } else {

                            await verify_bep20_token_deposit(userId, wallet.currency, wallet.currency_id, 'BEP20', wallet.short_name, contract_address['BEP20'], address.address, decimals['BEP20'], coin.min_deposit, coin.max_deposit)
                        }
                        // } else if(chain === 'BTC'){
                        //     console.log("in chain BTC ")
                        //     let decimals = JSON.parse(coin.decimals)
                        //     let contract_address = JSON.parse(coin.contract_address)
                        //     let address = await UserAddress.findOne({$and: [{user_id: userId}, {chain: 'BTC'}]}).select('address')
                        //     if(address === null) {
                        //         continue
                        //     } else {
                        //         console.log("in BTC else ")
                        //         await verify_btc_deposit(userId, wallet.currency, wallet.currency_id, 'BTC', wallet.short_name, contract_address['BTC'], address.address, decimals['BTC'])
                        //     }
                        // } else if(chain === 'TRC20'){
                        //     console.log("in chain TRC20 ")
                        //     let decimals = JSON.parse(coin.decimals)
                        //     let contract_address = JSON.parse(coin.contract_address)
                        //     let address = await UserAddress.findOne({$and: [{user_id: userId}, {chain: 'TRC20'}]}).select('address')
                        //     if(!address) {
                        //         continue
                        //     } else {
                        //         console.log("in TRC20 else")
                        //         await verify_trc20_token_deposit(userId, wallet.currency, wallet.currency_id, 'TRC20', wallet.short_name, contract_address['TRC20'], address.address, decimals['TRC20'], coin.min_deposit)
                        //     }
                        // } else if(chain === 'ERC20'){
                        //     console.log("in chain ERC20 ")
                        //     let decimals = JSON.parse(coin.decimals)
                        //     let contract_address = JSON.parse(coin.contract_address)
                        //     let address = await UserAddress.findOne({$and: [{user_id: userId}, {chain: 'ERC20'}]}).select('address')
                        //     if(address === null) {
                        //         continue;
                        //     } else {
                        //         console.log("in ERC20 else")
                        //         // await verify_erc20_token_deposit(userId, wallet.currency, wallet.currency_id, 'ERC20', wallet.short_name, contract_address['ERC20'], address.address, decimals['ERC20'])
                        //     }
                        // } else if(chain === 'ARBITRUM'){
                        //     console.log("in ARBITRUM chain");
                        //     let decimals = JSON.parse(coin.decimals)
                        //     let contract_address = JSON.parse(coin.contract_address)
                        //     let address = await UserAddress.findOne({$and: [{user_id: userId}, {chain: 'ARBITRUM'}]}).select('address')
                        //     if(address === null) {
                        //         continue;
                        //     } else {
                        //         await verify_arbiscan_token_deposit(userId, wallet.currency, wallet.currency_id, 'ARBITRUM', wallet.short_name, contract_address['ARBITRUM'], address.address, decimals['ARBITRUM'])
                        //     }
                        // } else if(chain === 'POLYGON'){

                        //     let decimals = JSON.parse(coin.decimals)
                        //     let contract_address = JSON.parse(coin.contract_address)
                        //     let address = await UserAddress.findOne({$and: [{user_id: userId}, {chain: 'POLYGON'}]}).select('address')
                        //     if(address === null) {
                        //         continue;
                        //     } else {
                        //         await verify_polygon_token_deposit(userId, wallet.currency, wallet.currency_id, 'POLYGON', wallet.short_name, contract_address['POLYGON'], address.address, decimals['POLYGON'])
                        //     }

                    } else {
                        console.log('Deposit verification for this chain is not available right now')
                    }
                }
            }
            return res.status(200).json({ success: true, message: 'New Transaction Fetched', data: [] })
        } catch (error) {

            return res.status(500).json({ success: false, message: "Error Occured", error: error.message, error_status: error.status })
        }
    },

    updateBalance: async (userId, coinId, amount, account_type) => {

        try {
            let update_sponser_wallet;
            if (account_type == "locked_balance") {
                update_sponser_wallet = await Wallets.updateOne(
                    {
                        user_id: userId,
                        currency_id: coinId
                    },
                    {
                        $inc: {
                            locked_balance: amount
                        }
                    },
                )
            } else {
                update_sponser_wallet = await Wallets.updateOne(
                    {
                        user_id: userId,
                        currency_id: coinId
                    },
                    {
                        $inc: {
                            balance: amount
                        }
                    },
                )
            }

            if (update_sponser_wallet.modifiedCount > 0) {
                return true
            } else {
                return false
            }
        } catch (error) {
            throw new Error(error.message)
        }
    },

    updateAllBalance: async (userId, amount) => {
        try {
            let data = await Wallets.updateMany(
                { user_id: userId },
                {
                    $set: {
                        balance: amount,
                        locked_balance: amount
                    }
                },
                { upsert: true }
            )
            if (data.upsertedCount > 0 || data.modifiedCount > 0) {
                return true;
            } else {
                throw await errorHandler('Some error occured while updating all balances', 406);
            }
        } catch (error) {
            throw await errorHandler(error.message, 406);
        }
    },


    update_locked_balance: async (userId, coinId, amount) => {
        try {
            let update_sponser_wallet = await Wallets.updateOne(
                {
                    user_id: userId,
                    currency_id: coinId
                },
                {
                    $inc: {
                        locked_balance: amount
                    }
                }
            )
            if (update_sponser_wallet.modifiedCount > 0) {
                return true
            } else {
                return false
            }
        } catch (error) {
            throw new Error(error.message)
        }
    },

    update_p2p_balance: async (userId, coinId, amount) => {
        try {
            let update_sponser_wallet = await Wallets.updateOne(
                {
                    user_id: userId,
                    currency_id: coinId
                },
                {
                    $inc: {
                        p2p_balance: amount
                    }
                }
            )
            if (update_sponser_wallet.modifiedCount > 0) {
                return true
            } else {
                return false
            }
        } catch (error) {
            throw new Error(error.message)
        }
    },

    update_p2p_locked: async (userId, coinId, amount) => {
        try {
            let update_sponser_wallet = await Wallets.updateOne(
                {
                    user_id: userId,
                    currency_id: coinId
                },
                {
                    $inc: {
                        p2p_locked_balance: amount
                    }
                }
            )
            if (update_sponser_wallet.modifiedCount > 0) {
                return true
            } else {
                return false
            }
        } catch (error) {
            throw new Error(error.message)
        }
    },

    withdrawal_currency: async (req, res) => {
        try {

            const { userId } = req.user;
            const { address, amount, currency_id, chain, email_or_phone, otp } = req.body;
            const token = req.headers.authorization
            // return res.status(406).json({success: false, message: 'Withdrawal system is not available on ip', data: []})

            // Check if address is valid or not for particular chain
            let check = await address_validation(address, chain);
            if (!check) {
                return res.status(406).json({ success: false, message: `This address is not a valid address for ${chain} chain`, data: [] })
            }

            let find_otp = await Otps.findOne({ email_or_phone: email_or_phone }).select('otp');

            if (find_otp === null) {
                return res.status(406).json({ success: false, message: 'Please send otp first', data: [] })
            } else {
                if (find_otp.otp != otp) {
                    return res.status(406).json({ success: false, message: 'Incorrect otp please check and try again', data: [] })
                }
            }

            // First we have to check minimum and maximum withdrawal
            let coin = await Currency.findOne({ _id: currency_id });

            if (amount < coin.min_withdrawal || amount > coin.max_withdrawal) {
                return res.status(406).json({ success: false, message: `You can withdrawal minimum ${coin.min_withdrawal} or maximum ${coin.max_withdrawal} for this currency`, data: [] })
            }

            // Second we have to check if user have enough balance to withdrawal from his account
            let wallet = await Wallets.findOne({ $and: [{ user_id: userId }, { currency_id: currency_id }] });

            if (wallet.balance < amount) {
                return res.status(406).json({ success: false, message: 'You dont have enough balance to withdrawal', data: [] })
            }

            // Third we have to find user email
            let user = await Users.findOne({ _id: userId }).select('emailId')

            if (coin.short_name === 'RIK') {
                // First we have to generate the token
                let options = {
                    UserName: WITHDRAWAL_USERNAME,
                    Password: WITHDRAWAL_PASSWORD,
                    grant_type: WITHDRAWAL_GRANT_TYPE
                }

                let headers = {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
                let chain_token = await axios.post(RIK_WITHDRAWAL_TOKEN_URL, options, { headers: headers })

                if (chain_token.status === 200 && chain_token.statusText === 'OK') {
                    // lets generate a order id
                    const order_id = await crypto.randomBytes(32).toString("hex");
                    let final_amount = amount - coin.withdrawal_fee

                    let options2 = {
                        ORDERID: order_id,
                        USERID: userId,
                        EMAIL: user.emailId,
                        ADDRESS: address,
                        TOTAL_RIK: final_amount,
                        TOKEN: token
                    }

                    let headers2 = {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${chain_token.data['access_token']}`
                    }
                    let send_request = await axios.post(RIK_WITHDRAWAL_URL, options2, { headers: headers2 })
                    if (send_request.data.status) {
                        // we have to deduct amount from balance
                        let deduct_balance = await Wallets.updateOne(
                            { $and: [{ user_id: userId }, { currency_id: currency_id }] },
                            {
                                $inc: {
                                    balance: -amount,
                                    locked_balance: amount
                                }
                            },
                            { upsert: true }
                        )

                        if (deduct_balance.upsertedCount > 0 || deduct_balance.modifiedCount > 0) {
                            // we have to create a pending transaction of withdrawal
                            let transaction_obj = {
                                user_id: userId,
                                currency: coin.name,
                                currency_id: coin.id,
                                chain: chain,
                                short_name: coin.short_name,
                                order_id: order_id,
                                amount: final_amount,
                                transaction_type: 'WITHDRAWAL',
                                fee: coin.withdrawal_fee,
                                status: "PENDING",
                                from_address: '',
                                to_address: address
                            }

                            let transaction = await WalletTransaction.create(transaction_obj)
                            if (transaction) {
                                return res.status(200).json({ success: true, message: 'Withdrawal Request Submitted', data: [] })
                            } else {
                                return res.status(406).json({ success: true, message: 'Some error occured while creating withdrawal transaction', data: [] })
                            }
                        }
                    }
                } else {
                    return res.status(500).json({ success: false, message: 'Some error occured while generating token for withdrawal please contact support', data: [] })
                }
            } else if (coin.short_name === 'TBT') {
                // First we have to generate the token
                let options = {
                    UserName: WITHDRAWAL_USERNAME,
                    Password: WITHDRAWAL_PASSWORD,
                    grant_type: WITHDRAWAL_GRANT_TYPE
                }

                let headers = {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
                let chain_token = await axios.post(RIK_WITHDRAWAL_TOKEN_URL, options, { headers: headers })

                if (chain_token.status === 200 && chain_token.statusText === 'OK') {
                    // lets generate a order id
                    const order_id = await crypto.randomBytes(32).toString("hex");
                    let final_amount = amount - coin.withdrawal_fee

                    let options2 = {
                        ORDERID: order_id,
                        USERID: userId,
                        EMAIL: user.emailId,
                        ADDRESS: address,
                        TOTAL_TBT: final_amount,
                        TOKEN: token
                    }

                    let headers2 = {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${chain_token.data['access_token']}`
                    }
                    let send_request = await axios.post(TBT_WITHDRAWAL_URL, options2, { headers: headers2 })
                    if (send_request.data.status) {
                        // we have to deduct amount from balance
                        let deduct_balance = await Wallets.updateOne(
                            { $and: [{ user_id: userId }, { currency_id: currency_id }] },
                            {
                                $inc: {
                                    balance: -amount,
                                    locked_balance: amount
                                }
                            },
                            { upsert: true }
                        )

                        if (deduct_balance.upsertedCount > 0 || deduct_balance.modifiedCount > 0) {
                            // we have to create a pending transaction of withdrawal
                            let transaction_obj = {
                                user_id: userId,
                                currency: coin.name,
                                currency_id: coin.id,
                                chain: chain,
                                short_name: coin.short_name,
                                order_id: order_id,
                                amount: final_amount,
                                transaction_type: 'WITHDRAWAL',
                                fee: coin.withdrawal_fee,
                                status: "PENDING",
                                from_address: '',
                                to_address: address
                            }

                            let transaction = await WalletTransaction.create(transaction_obj)
                            if (transaction) {
                                return res.status(200).json({ success: true, message: 'Withdrawal Request Submitted', data: [] })
                            } else {
                                return res.status(406).json({ success: true, message: 'Some error occured while creating withdrawal transaction', data: [] })
                            }
                        }
                    }
                } else {
                    return res.status(500).json({ success: false, message: 'Some error occured while generating token for withdrawal please contact support', data: [] })
                }
            } else if (coin.short_name === 'USDT') {
                // First we have to generate the token
                let options = {
                    UserName: WITHDRAWAL_USERNAME,
                    Password: WITHDRAWAL_PASSWORD,
                    grant_type: WITHDRAWAL_GRANT_TYPE
                }

                let headers = {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
                let chain_token = await axios.post(RIK_WITHDRAWAL_TOKEN_URL, options, { headers: headers })

                if (chain_token.status === 200 && chain_token.statusText === 'OK') {
                    // lets generate a order id
                    const order_id = await crypto.randomBytes(32).toString("hex");
                    let final_amount = amount - coin.withdrawal_fee

                    let options2 = {
                        ORDERID: order_id,
                        USERID: userId,
                        EMAIL: user.emailId,
                        ADDRESS: address,
                        TOTAL_USDT: final_amount,
                        TOKEN: token
                    }

                    let headers2 = {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${chain_token.data['access_token']}`
                    }
                    let send_request = await axios.post(USDT_WITHDRAWAL_URL, options2, { headers: headers2 })
                    if (send_request.data.status) {
                        // we have to deduct amount from balance
                        let deduct_balance = await Wallets.updateOne(
                            { $and: [{ user_id: userId }, { currency_id: currency_id }] },
                            {
                                $inc: {
                                    balance: -amount,
                                    locked_balance: amount
                                }
                            },
                            { upsert: true }
                        )

                        if (deduct_balance.upsertedCount > 0 || deduct_balance.modifiedCount > 0) {
                            // we have to create a pending transaction of withdrawal
                            let transaction_obj = {
                                user_id: userId,
                                currency: coin.name,
                                currency_id: coin.id,
                                chain: chain,
                                short_name: coin.short_name,
                                order_id: order_id,
                                amount: final_amount,
                                transaction_type: 'WITHDRAWAL',
                                fee: coin.withdrawal_fee,
                                status: "PENDING",
                                from_address: '',
                                to_address: address
                            }

                            let transaction = await WalletTransaction.create(transaction_obj)
                            if (transaction) {
                                return res.status(200).json({ success: true, message: 'Withdrawal Request Submitted', data: [] })
                            } else {
                                return res.status(406).json({ success: true, message: 'Some error occured while creating withdrawal transaction', data: [] })
                            }
                        }
                    }
                } else {
                    return res.status(500).json({ success: false, message: 'Some error occured while generating token for withdrawal please contact support', data: [] })
                }
            } else if (coin.short_name === 'TRX') {
                // First we have to generate the token
                let options = {
                    UserName: WITHDRAWAL_USERNAME,
                    Password: WITHDRAWAL_PASSWORD,
                    grant_type: WITHDRAWAL_GRANT_TYPE
                }

                let headers = {
                    "Content-Type": "application/x-www-form-urlencoded"
                }
                let chain_token = await axios.post(RIK_WITHDRAWAL_TOKEN_URL, options, { headers: headers })

                if (chain_token.status === 200 && chain_token.statusText === 'OK') {
                    // lets generate a order id
                    const order_id = await crypto.randomBytes(32).toString("hex");
                    let final_amount = amount - coin.withdrawal_fee

                    let options2 = {
                        ORDERID: order_id,
                        USERID: userId,
                        EMAIL: user.emailId,
                        ADDRESS: address,
                        TOTAL_TRX: final_amount,
                        TOKEN: token
                    }

                    let headers2 = {
                        "Content-Type": "application/json",
                        "Authorization": `Bearer ${chain_token.data['access_token']}`
                    }
                    let send_request = await axios.post(TRX_WITHDRAWAL_URL, options2, { headers: headers2 })
                    if (send_request.data.status) {
                        // we have to deduct amount from balance
                        let deduct_balance = await Wallets.updateOne(
                            { $and: [{ user_id: userId }, { currency_id: currency_id }] },
                            {
                                $inc: {
                                    balance: -amount,
                                    locked_balance: amount
                                }
                            },
                            { upsert: true }
                        )

                        if (deduct_balance.upsertedCount > 0 || deduct_balance.modifiedCount > 0) {
                            // we have to create a pending transaction of withdrawal
                            let transaction_obj = {
                                user_id: userId,
                                currency: coin.name,
                                currency_id: coin.id,
                                chain: 'TRC20',
                                short_name: coin.short_name,
                                order_id: order_id,
                                amount: final_amount,
                                transaction_type: 'WITHDRAWAL',
                                fee: coin.withdrawal_fee,
                                status: "PENDING",
                                from_address: '',
                                to_address: address
                            }

                            let transaction = await WalletTransaction.create(transaction_obj)
                            if (transaction) {
                                return res.status(200).json({ success: true, message: 'Withdrawal Request Submitted', data: [] })
                            } else {
                                return res.status(406).json({ success: true, message: 'Some error occured while creating withdrawal transaction', data: [] })
                            }
                        }
                    }
                } else {
                    return res.status(500).json({ success: false, message: 'Some error occured while generating token for withdrawal please contact support', data: [] })
                }
            } else {
                return res.status(500).json({ success: false, message: "Withdrawal is not available in this currency right now", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    verify_withdrawals: async (req, res) => {
        try {
            let { user_id, order_id, currency, transfered_amount, status, transaction_hash } = req.body;

            // first we have to find the users order
            let transaction = await WalletTransaction.findOne({ $and: [{ user_id: user_id }, { order_id: order_id }, { short_name: currency }] });
            if (transaction === null) {
                return res.status(406).json({ success: false, message: 'No order found for this user with this order id and currency', data: [] })
            } else {
                // check if transaction is already completed
                if (transaction.status != 'PENDING') {
                    return res.status(200).json({ success: false, message: 'Transaction with this order id is already completed', data: [] })
                }

                // check if amount is not equal to transaction amount
                if (transaction.amount != transfered_amount) {
                    return res.status(200).json({ success: false, message: `You have to transfer ${transaction.amount} ${transaction.short_name} for this order`, data: [] })
                }
                if (status === 'COMPLETE') {
                    // if we found the order we have to update the order
                    let update = await WalletTransaction.updateOne(
                        { $and: [{ user_id: user_id }, { order_id: order_id }, { short_name: currency }] },
                        {
                            $set: {
                                status: status,
                                transaction_hash: transaction_hash || ''
                            }
                        },
                        { upsert: true }
                    )

                    if (update.upsertedCount > 0 || update.modifiedCount > 0) {
                        // we have to remove this amount from locked balance as well
                        let update_balance = await Wallets.updateOne(
                            { $and: [{ user_id: user_id }, { currency_id: transaction.currency_id }] },
                            {
                                $inc: {
                                    locked_balance: -transfered_amount
                                }
                            },
                            { upsert: true }
                        )
                        if (update_balance.upsertedCount > 0 || update_balance.modifiedCount > 0) {
                            return res.status(200).json({ success: true, message: 'Request Saved Successfully', data: [] })
                        } else {
                            return res.status(406).json({ success: true, message: 'some error occured while saving this request please contact support', data: [] })
                        }
                    }
                } else {
                    // if we found the order we have to update the order
                    let update = await WalletTransaction.updateOne(
                        { $and: [{ user_id: user_id }, { order_id: order_id }, { short_name: currency }] },
                        {
                            $set: {
                                status: status,
                                transaction_hash: transaction_hash || ''
                            }
                        },
                        { upsert: true }
                    )

                    if (update.upsertedCount > 0 || update.modifiedCount > 0) {
                        // we have to remove this amount from locked balance as well
                        transfered_amount = transfered_amount + transaction.fee
                        let update_balance = await Wallets.updateOne(
                            { $and: [{ user_id: user_id }, { currency_id: transaction.currency_id }] },
                            {
                                $inc: {
                                    locked_balance: -transfered_amount,
                                    balance: transfered_amount
                                }
                            },
                            { upsert: true }
                        )
                        if (update_balance.upsertedCount > 0 || update_balance.modifiedCount > 0) {
                            return res.status(200).json({ success: true, message: 'Request Saved Successfully', data: [] })
                        } else {
                            return res.status(406).json({ success: true, message: 'some error occured while saving this request please contact support', data: [] })
                        }
                    }
                }
            }

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    generate_withdrawal_token: async (req, res) => {
        try {
            let options = {
                UserName: WITHDRAWAL_USERNAME,
                Password: WITHDRAWAL_PASSWORD,
                grant_type: WITHDRAWAL_GRANT_TYPE
            }



            let headers = {
                "Content-Type": "application/x-www-form-urlencoded"
            }

            let chain_token = await axios.post(RIK_WITHDRAWAL_TOKEN_URL, options, { headers: headers })

            return res.status(200).json({ success: true, message: 'Token generated', data: chain_token.data['access_token'] })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    manual_withdrawal: async (req, res) => {
        try {
            const { userId } = req.user;
            const { coinName, withdrawal_address, amount, chain, email_or_phone, verification_code, usdt_balance } = req.body;

            //   const walletdeposit = await WalletTransaction.find({user_id:userId,transaction_type:"WITHDRAWAL"})
            let coin_id = await Currency.findOne({ short_name: coinName })
            const fee = coin_id.withdrawal_fee || 2.5;
            // const fee = 2.5;
            if (parseInt(amount) < coin_id.min_withdrawal) {
                res.status(202).json({ success: false, message: `minimum withdrawal balance is ${coin_id.min_withdrawal} ${coinName}` })
            }
            if (parseInt(amount) > coin_id.max_withdrawal) {
                res.status(202).json({ success: false, message: `maximum withdrawal balance is ${coin_id.max_withdrawal} ${coinName}` })
            }

            let submitted;
            const user_data = await Users.findOne({ _id: userId });
            if (user_data.emailId === null) {
                return res.status(201).json({ success: false, message: "First Complete profile section,Add Email" })
            }
            //  const user_balance = await Wallets.findOne({user_id:userId,short_name:coinName});
            // if(usdt_balance>200 ){
            //     return res.status(201).json({success:false,message:"Please First Complete your KYC,When it verified by admin then you can withdraw"})
            // }
            if (user_data.kycVerified !== 2 && usdt_balance > 5000) {
                return res.status(201).json({ success: false, message: "Please First Complete your KYC,When it verified by admin then you can withdraw" })
            }
            let user_otp = await Otps.findOne({
                email_or_phone: email_or_phone,
            }).select("otp");

            if (user_otp === null) {
                return res.status(200).json({
                    success: true,
                    message: "please send otp first",
                    data: [],
                });
            } else if (user_otp.otp != verification_code) {
                return res.status(500).json({
                    success: false,
                    message: "verification code not matched",
                    data: [],
                });
            }

            // get Coin Id by Coin Name


            // Check if Amount is available in Balance
            let userBalance = await Wallets.findOne({ $and: [{ user_id: userId }, { short_name: coinName }] })

            if (userBalance.balance < amount) {
                return res.status(500).json({ success: false, message: "Insufficient Balance", data: [] })
            }

            // Deduct Amount from Balance
            await module.exports.updateBalance(userId, coin_id.id, -amount)

            // Update the balance in Locked Balance
            await module.exports.update_locked_balance(userId, coin_id.id, amount)

            // 10% fee from user will be deducted
            // let fee_amount = amount * 10 / 100
            // let remaining_amount = parseInt(amount) - coin_id.transaction_fee;
            // console.log(remaining_amount,"checkamount ");
            let transaction = {
                user_id: userId,
                currency: coin_id.name,
                currency_id: coin_id.id,
                chain: chain,
                short_name: coin_id.short_name,
                amount: amount - fee,
                status: 'PENDING',
                fee: fee,
                transaction_type: "WITHDRAWAL",
                to_address: withdrawal_address
            }

            submitted = await WalletTransaction.create(transaction)

            await email_marketing('withdrawal_confirmation', transaction, user_data.emailId)
            return res.status(200).json({ success: true, message: "Withdrawal Initiated Successfully", data: transaction })

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },
    user_cancel_withdrawal: async (req, res) => {
        try {
            const { userId } = req.user;
            const { _id, amount, currency_id, fee } = req.body;
            const fullamount = amount + fee;

            //first check if request is already processd or not 
            const updatedTran = await WalletTransaction.findOne({ _id: _id })
            if (updatedTran.status === "CANCELLED") {
                return res.json({ success: false, message: " Request Already Cancelled" });
            }
            if (updatedTran.status === "COMPLETED") {
                return res.json({ success: false, message: " Request Already processed" });
            }
            // Update the Wallettransaction model with _id and status


            await module.exports.updateBalance(userId, currency_id, amount)
            await module.exports.update_locked_balance(userId, currency_id, -amount)

            const updatedTransaction = await WalletTransaction.findOneAndUpdate(
                { _id, user_id: userId }, // Find by _id and user_id
                {
                    $set: {
                        status: "CANCELLED",
                        amount: fullamount,
                        fee: 0
                    }
                },
                { new: true } // To return the updated document
            );

            if (!updatedTransaction) {
                return res.status(404).json({ success: false, message: "Transaction not found or unauthorized" });
            }

            return res.status(200).json({ success: true, transaction: updatedTransaction });
        } catch (error) {
            console.error("Error updating transaction:", error);
            return res.status(500).json({ success: false, message: "Server error" });
        }
    },

    deposit_inr: async (req, res) => {
        try {
            const { userId } = req.user;
            const { amount, transaction_number, payment_type, admin_bank_details } = req.body;
            let deposit_slip


            if (req.file != undefined) {
                deposit_slip = req.file.filename;
            } else {
                return res.status(406).json({
                    success: false,
                    message: "Please attach a deposit slip for verification",
                    data: []
                });
            }
            if (amount < 100 || amount > 2000000) {
                return res.status(406).json({
                    success: false,
                    message: "Minimum Limit is 100 to 2,00,000 Rupees",
                    data: []
                });
            }

            // Get INR Coin
            let get_inr = await Currency.findOne({ short_name: "INR" })

            // 1% withdrawal charge will be there per withdrawal
            let fee = 1 / 100;
            let total_amount = amount - fee;



            // Update the balance in Locked Balance
            let update_locked_balance = await module.exports.update_locked_balance(userId, get_inr.id, total_amount)



            // Transaction
            let transaction = {};
            transaction.user_id = userId,
                transaction.deposit_slip = req.file.path,
                transaction.transaction_type = "DEPOSIT",
                transaction.currency = get_inr.name,
                transaction.currency_id = get_inr._id,
                transaction.short_name = get_inr.short_name,
                transaction.transaction_number = transaction_number,
                transaction.fee = fee,
                transaction.chain = get_inr.chain[0],
                transaction.status = "PENDING",
                transaction.amount = total_amount
            transaction.payment_type = payment_type
            transaction.admin_bank_details = admin_bank_details

            let createTransaction = await WalletTransaction.create(transaction);
            if (createTransaction) {
                return res.status(200).json({
                    success: true,
                    message: "Request submitted to Admin",
                    data: []
                })
            } else {
                return res.status(406).json({
                    success: false,
                    message: "Some error occured while submitting request please try again some time",
                    data: []
                })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    withdraw_inr: async (req, res) => {
        try {
            const { userId } = req.user;
            const { amount, user_bank } = req.body;

            if (amount < 0 || amount < 500 || amount > 5000) {
                return res.status(500).json({
                    success: false,
                    message: "Withdrawal Limit is 500 to 5000 Rupee",
                    data: []
                })
            }

            // GET COIN BALANCE
            let coin_balance = await Wallets.findOne({
                $and:
                    [
                        { short_name: "INR" },
                        { user_id: userId }
                    ]
            })

            if (coin_balance.balance < amount) {
                return res.status(500).json({
                    success: false,
                    message: "Insufficient Balance",
                    data: []
                })
            }

            let bank_check = await UserBankDetails.findOne({ user_id: userId });
            if (!bank_check) {
                return res.status(500).json({ success: false, message: "Please add a bank account first", data: [] })
            }

            // if (check_upi === true) {
            //     console.log("under UPI VALIDATION CODEE")

            // // 2% withdrawal charge will be there per withdrawal on UPI 
            // let fee = 2 / 100;
            // console.log(fee, ": feeeee")
            // console.log(amount, ": amonunttttttt")
            // let total_amount = amount - fee;
            // console.log(total_amount,  ": total amountttt")

            // // Transaction
            // let transaction = {};
            // transaction.user_id = userId,
            // transaction.transaction_type = "WITHDRAWAL",
            // transaction.currency = coin_balance.currency,
            // transaction.currency_id = coin_balance.currency_id,
            // transaction.short_name = coin_balance.short_name,
            // transaction.fee = fee,
            // transaction.chain = coin_balance.chain[0],
            // transaction.status = "PENDING",
            // transaction.amount = total_amount
            // transaction.user_bank = user_bank


            // let createTransaction = await WalletTransaction.create(transaction);

            // if (createTransaction) {
            //     // Deduct Amount From Balance
            //     let updateBalance = await module.exports.updateBalance(userId, coin_balance.currency_id, -total_amount)


            //     // Update the balance in Locked Balance
            //     await module.exports.update_locked_balance(userId, coin_balance.currency_id, total_amount)

            //     if (!updateBalance) {
            //         return res.status(500).json({
            //             success: false,
            //             message: "Some error occured",
            //             data: []
            //         })
            //     }

            //     return res.status(200).json({
            //         success: true,
            //         message: "Request submitted to Admin",
            //         data: []
            //     })
            // }

            // } else {

            // 5% withdrawal charge will be there per withdrawal
            let fee = 5 / 100;


            let total_amount = amount - fee;


            // Transaction
            let transaction = {};
            transaction.user_id = userId,
                transaction.transaction_type = "WITHDRAWAL",
                transaction.currency = coin_balance.currency,
                transaction.currency_id = coin_balance.currency_id,
                transaction.short_name = coin_balance.short_name,
                transaction.fee = fee,
                transaction.chain = coin_balance.chain[0],
                transaction.status = "PENDING",
                transaction.amount = total_amount
            transaction.user_bank = user_bank


            let createTransaction = await WalletTransaction.create(transaction);

            if (createTransaction) {
                // Deduct Amount From Balance
                let updateBalance = await module.exports.updateBalance(userId, coin_balance.currency_id, -total_amount)


                // Update the balance in Locked Balance
                await module.exports.update_locked_balance(userId, coin_balance.currency_id, total_amount)

                if (!updateBalance) {
                    return res.status(500).json({
                        success: false,
                        message: "Some error occured",
                        data: []
                    })
                }

                return res.status(200).json({
                    success: true,
                    message: "Request submitted to Admin",
                    data: []
                })
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            })
        }
    },

    create_wallet_for_partner: async (userId) => {
        try {
            let coins = await Currency.find();
            // Iterate over each currency to manage user's wallet
            for (let i = 0; i < coins.length; i++) {
                let wallet = {
                    user_id: userId,
                    currency: coins[i].name,
                    currency_id: coins[i]._id,
                    chain: coins[i].chain,
                    short_name: coins[i].short_name,
                    contract_address: coins[i].contract_address,
                    icon_path: coins[i].icon_path,
                    address: '', // Set default values for new wallets
                    private_key: ''
                };

                // Check if a wallet already exists for the given user and currency
                let existingWallet = await Wallets.findOne({ user_id: userId, currency_id: wallet.currency_id });

                if (existingWallet) {
                    // If wallet exists, increment the balance by 200
                    existingWallet.balance += 200;
                    await existingWallet.save(); // Save the changes to the existing wallet
                } else {
                    // If wallet does not exist, set initial balance to 200
                    wallet.balance = 200;
                    await Wallets.create(wallet); // Create a new wallet with the initial balance
                }
            }

            return 1;
        } catch (error) {
            console.error("Error in create_wallet2:", error);
            // No res object available since this is not an Express middleware
            // Proper error handling with a response is not applicable here
            throw new Error(error.message); // Throwing error for higher-level handling
        }
    },
    updateBalanceByCoinId: async (user_id, coin_id, amount) => {
        try {
            let data = await Wallets.updateOne(
                {
                    user_id: user_id,
                    currency_id: coin_id
                },
                {
                    $inc: {
                        balance: amount
                    }
                }
            )
            if (data.modifiedCount > 0) {
                return true
            } else {
                throw await errorHandler('Some error occured while updating balance', 406);
            }
        } catch (error) {
            throw await errorHandler(error.message, 406);
        }
    },

    usersWalletByCurrencyId: async (user_id, currency_id) => {
        try {
            let data = await Wallets.findOne({ user_id: user_id, currency_id: currency_id })
            if (data != null) {
                return data;
            } else {
                throw await errorHandler('No wallet found', 406);
            }
        } catch (error) {
            throw await errorHandler(error.message, 406);
        }
    }

}