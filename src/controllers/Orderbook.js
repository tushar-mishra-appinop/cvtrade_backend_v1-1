const Orderbook = require('../models/Orderbook');
const {errorHandler} = require('../utils/CustomError');


module.exports = {

    deleteBuyOrderForBot: async (pair, order_by, side, status) => {
      try {
        let data = await Orderbook.deleteMany({
          $and: [
            { base_currency_id: pair.base_currency_id },
            { quote_currency_id: pair.quote_currency_id },
            { price: { $gt: pair.buy_price - pair.trading_bot_gap / 2 } },
            { order_by: order_by },
            { side: side },
            { status: { $ne: status } },
          ],
        });
        if (data) {
          return true;
        } else {
          throw await errorHandler("Some error occured in order deletion", 406);
        }
      } catch (error) {
        throw await errorHandler(error.message, 406);
      }
    },
  
    deleteSellOrderForBot: async (pair, order_by, side, status) => {
      try {
        let data = await Orderbook.deleteMany({
          $and: [
            { base_currency_id: pair.base_currency_id },
            { quote_currency_id: pair.quote_currency_id },
            { price: { $lt: pair.buy_price + pair.trading_bot_gap / 2 } },
            { order_by: order_by },
            { side: { $eq: side } },
            { status: { $ne: status } },
          ],
        });
        if (data) {
          return true;
        } else {
          throw await errorHandler("Some error occured in order deletion", 406);
        }
      } catch (error) {
        throw await errorHandler(error.message, 406);
      }
    },
  
    deleteNegativeOrderForBot: async (pair, order_by, status) => {
      try {
        let data = await Orderbook.deleteMany({
          $and: [
            { base_currency_id: pair.base_currency_id },
            { quote_currency_id: pair.quote_currency_id },
            { remaining: { $lt: 0 } },
            { order_by: order_by },
            { status: { $ne: status } },
          ],
        });
        if (data) {
          return true;
        } else {
          throw await errorHandler("Some error occured in order deletion", 406);
        }
      } catch (error) {
        throw await errorHandler(error.message, 406);
      }
    },
  
    deletePastOrderByBot: async (sixHoursAgo, order_by) => {
      try {
        let data = await Orderbook.deleteMany({
          $and: [{ createdAt: { $lt: sixHoursAgo } }, { order_by: order_by }],
        });
        if (data) {
          return true;
        } else {
          throw await errorHandler("Some error occured in order deletion", 406);
        }
      } catch (error) {
        throw await errorHandler(error.message, 406);
      }
    },
  };

