const Pairs = require('../models/Pairs')
const qbsTransaction = require("../models/quickbuysell");
const { usersWalletByCurrencyId, updateBalanceByCoinId } = require('./WalletController');

module.exports = {

  quick_buy_sell: async (req, res) => {
    try {
      const { userId } = req.user;

      const { base_currency, quote_currency, side, amount, swapped_amount } = req.body;

      // find pair price
      let pair = await Pairs.findOne({ $and: [{ base_currency: base_currency }, { quote_currency: quote_currency }] })
      // console.log(pair,  ": pair");
      if (pair === null) {
        return res.status(406).json({ success: false, message: 'No pair found!!', data: [] })
      }
      let obj = {};
      // let amount = pair.buy_price * quantity;
      if (side === 'BUY') {
        // check if user have the amount in quote currency


        let check = await usersWalletByCurrencyId(userId, pair.quote_currency_id);
        if (check === null) {
          return res.status(406).json({ success: false, message: "No wallet found for this currency!!", data: [], })
        } else if (check.balance < amount) {
          return res.status(406).json({ success: false, message: "Insuficient balance !!", data: [], });
        }
        // add base currency quantity into wallet
        //   64f5c203e715a943c725f7ca
        await updateBalanceByCoinId(userId, pair.base_currency_id, swapped_amount);
        // deduct quote currency amount into wallet
        await updateBalanceByCoinId(userId, pair.quote_currency_id, -amount);
        obj = {
          userId: userId,
          from: quote_currency,
          to: base_currency,
          base_currency_id: pair.base_currency_id,
          quote_currency_id: pair.quote_currency_id,
          pay_amount: amount,
          get_amount: swapped_amount,
          side: side,
        }
      } else if (side === 'SELL') {
        // check if user have the amount in base currency
        let check = await usersWalletByCurrencyId(userId, pair.base_currency_id);
        if (check === null) {
          return res.status(406).json({ success: false, message: 'No wallet found for this currency!!', data: [] })
        } else if (check.balance < amount) {
          return res.status(406).json({ success: false, message: 'Insuficient balance!!', data: [] })
        }

        // deduct base currency amount into wallet ,amount from deducted
        await updateBalanceByCoinId(userId, pair.base_currency_id, -amount);

        // add quote currency amount into wallet 
        await updateBalanceByCoinId(userId, pair.quote_currency_id, swapped_amount);
        obj = {
          userId: userId,
          from: base_currency,
          to: quote_currency,
          base_currency_id: pair.base_currency_id,
          quote_currency_id: pair.quote_currency_id,
          pay_amount: amount,
          get_amount: swapped_amount,
          side: side,
        }
      } else {
        return res.status(406).json({ success: false, message: 'Please send side only BUY or SELL', data: [] })
      }

      //  console.log(obj,"obj");
      await qbsTransaction.create(obj);
      return res.status(200).json({ success: true, message: 'Transaction successfull', data: obj })
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message, data: [] })
    }
  },

  getQuickBuySellTransaction: async (req, res) => {
    try {
      const { userId } = req.user;
      const { skip, limit } = req.query;
      // userId = "660510b4cc76cb79ebf91747"
      let data = await qbsTransaction.find({ userId: userId }).skip(skip).limit(parseInt(limit)).sort({ createdAt: -1 });
      return res.status(200).json({ success: true, message: 'Transaction Fetched!!', data: data });
    } catch (error) {
      return res.status(500).json({ success: false, message: error.message, data: [] });
    }
  }

}