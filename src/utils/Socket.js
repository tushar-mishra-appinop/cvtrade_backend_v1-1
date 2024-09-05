const Pairs = require('../models/Pairs');
const Wallets = require('../models/Wallets')

module.exports = {
    all_pairs: async(req, res) => {
        try {
            let pairs = await Pairs.find()
            return pairs
        } catch (error) {
            throw Error(error);
        }
    },

    wallet_balance: async(user_id, currency_id) => {
        try {
            let balance = await Wallets.findOne({$and: [{user_id: user_id, currency_id: currency_id}]})
            if(balance) {
                
                return balance['balance']
            } else {
                return 0;
            }
        } catch (error) {
            throw Error(error);
        }
    },

    hot_pairs: async() => {
        try {
            let pairs = await Pairs.find().sort({change: -1})
            return pairs
        } catch (error) {
            throw Error(error.message)
        }
    },

    new_listed: async() => {
        try {
            let pairs = await Pairs.find().sort({createdAt: -1})
            return pairs
        } catch (error) {
            throw Error(error.message)
        }
    }
}