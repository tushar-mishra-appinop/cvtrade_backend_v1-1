const Pairs = require("../models/Pairs");
const CurrencyController = require("../controllers").CurrencyController;
const Currency = require("../models/Currency");
const OrderbookController = require("../controllers/Orderbook");
const engineFifo = require("../utils/EngineFifo");
const { WalletController, ExchangeController } = require("../controllers");

//OLD CODE Of Trading Bot
// const trading_bot = async() => {
//     console.log("inside trading bot function...")
//     let pairs = await Pairs.find({available: 'GLOBAL'});
//     // console.log(pairs,"here is par");
//     for (const coin of pairs){
//         console.log(coin.base_currency,"insidde id",coin.quote_currency);
//         if(coin.base_currency === 'BTC' && coin.quote_currency === 'USDT') {

//             let random_number = Math.floor(Math.random() * 5) + 1
//             console.log(random_number,"random_number");
//             console.log("iinsdue", coin.buy_price,"testing is ");
//             // generate bids
//             const bidPrice = coin.buy_price + (i + random_number) * 0.5
//             const bidQuantity = (i + 0.05) * 2;

//             // generate asks
//             const askPrice = coin.buy_price - (i + 1) * 0.5;
//             const askQuantity = (i + 0.05) * 2;

//             let coin = await Currency.findOne({_id: coin.base_currency_id})
//             console.log(coin, "coin data")
//             const sell_order = {}
//             sell_order.user_id = '6467415f12a71e0f5a97b4af'
//             sell_order.order_type = 'MARKET';
//             sell_order.base_currency_id = coin.base_currency_id
//             sell_order.quote_currency_id = coin.quote_currency_id
//             sell_order.ask_currency = coin.quote_currency;
//             sell_order.side = 'SELL';
//             sell_order.price = bidPrice.toFixed(8);
//             sell_order.quantity = bidQuantity;
//             sell_order.filled = 0;
//             sell_order.remaining = bidQuantity;
//             sell_order.maker_fee = coin.maker_fee
//             sell_order.taker_fee = coin.taker_fee
//             sell_order.status = 'PENDING';
//             sell_order.transaction_fee = coin.transaction_fee;
//             sell_order.tds = coin.tds;

//             const buy_order = {}
//             buy_order.user_id = '6467415f12a71e0f5a97b4af'
//             buy_order.order_type = 'MARKET';
//             buy_order.base_currency_id = coin.base_currency_id
//             buy_order.quote_currency_id = coin.quote_currency_id
//             buy_order.ask_currency = coin.base_currency;
//             buy_order.side = 'BUY';
//             buy_order.price = askPrice.toFixed(8);
//             buy_order.quantity = askQuantity;
//             buy_order.filled = 0;
//             buy_order.remaining = askQuantity;
//             buy_order.maker_fee = coin.maker_fee
//             buy_order.taker_fee = coin.taker_fee
//             buy_order.status = 'PENDING';
//             buy_order.transaction_fee = coin.transaction_fee;
//             buy_order.tds = coin.tds;

//             var num = 2
//             if(num === 2) {
//                 console.log('Sell order is executing')
//                 let update_sell = await Orderbook.create(sell_order)
//                 if(update_sell) {
//                     let exec = await engineFifo(sell_order)
//                     if(exec) {
//                         num = 3
//                     }
//                 }
//             } else {
//                 console.log('Buy order is executing')
//                 let update_buy = await Orderbook.create(buy_order)
//                 if(update_buy) {
//                     let exec = await engineFifo(buy_order)
//                     if(exec) {
//                         num = 2
//                     }

//                 }
//             }
//         }
//         console.log("bot function ended...")
//         // return true
//     }
// }

function generateRandomOrder(lastPrice, minQuantity, maxQuantity, gap, i) {
  try {
    // console.log("inside generate random order")
    const quantity = (
      Math.random() * (maxQuantity - minQuantity) +
      minQuantity
    ).toFixed(3);
    // console.log("🚀 ~ generateRandomOrder ~ quantity:", quantity)
    let orderType = Math.random() < 0.5 ? "BUY" : "SELL";
    // console.log("🚀 ~ generateRandomOrder ~ Math.random():", Math.random())
    // console.log("🚀 ~ generateRandomOrder ~ orderType:", orderType)

    let userId = "64d6053ef0615d1e6dca0eab";
    // console.log(
    //   `Math.random is ${Math.random()} so the order type will be ${orderType}`
    // );


    let priceChange;
    let price;
    if (orderType === "BUY") {
      priceChange = gap / 2;
      // Calculate the new price based on the last price
      price = (parseFloat(lastPrice) - parseFloat(priceChange)).toFixed(8);
    } else {
      priceChange = gap / 2;
      // Calculate the new price based on the last price
      price = (parseFloat(lastPrice) + parseFloat(priceChange)).toFixed(8);
    }
    // Calculate a random price change (positive or negative)
    price = Math.abs(price);
    return {
      userId,
      orderType,
      price,
      quantity: parseFloat(quantity),
    };
  } catch (error) {
    console.log(error.message, " : some error occured in generateRandomOrder");
  }
}

function generateRandomOrder2(lastPrice, minQuantity, maxQuantity, i) {
  try {
    const quantity = (
      Math.random() * (maxQuantity - minQuantity) +
      minQuantity
    ).toFixed(3);
    let orderType = Math.random() < 0.5 ? "BUY" : "SELL";
    let userId = "64d6053ef0615d1e6dca0eab";
    // console.log(
    //   `Math.random is ${Math.random()} so the order type will be ${orderType}`
    // );
    let price;
    price = lastPrice;
    return {
      userId,
      orderType,
      price,
      quantity: parseFloat(quantity + minQuantity),
    };
  } catch (error) {
    console.log(error.message, " : error occured in generateRandomOrder2");
  }
}

const trading_bot = async () => {
  try {
    let pairs = await CurrencyController.getPairForBot();
    if (pairs?.length === 0) return
    console.log("🚀 ~ consttrading_bot= ~ pairs:", pairs)
    // console.log(pairs, "PAIRS DATA")
    let ab = await WalletController.create_wallet2("64d6053ef0615d1e6dca0eab");
    if (ab) {
      await WalletController.updateAllBalance(
        "64d6053ef0615d1e6dca0eab",
        500000000
      );
      let i = 1;
      for await (const pair of pairs) {
        console.log(
          // `Bot is running for ${pair.base_currency} / ${pair.quote_currency} with gap of ${pair.trading_bot_gap}`
        );
        let randomOrder;
        let randomOrder2;

        if (pair.buy_price < 0.1) {
          randomOrder = generateRandomOrder(
            pair.buy_price,
            200000,
            500000,
            pair.trading_bot_gap,
            i
          );
          // console.log(randomOrder, "DATA of RANDOM ORDER ")
          randomOrder2 = generateRandomOrder2(
            pair.buy_price,
            200000,
            500000,
            pair.trading_bot_gap,
            i
          );
          // console.log(randomOrder2, "DATA of RANDOM ORDER 2")
        } else if (pair.buy_price > 0.1 && pair.buy_price < 1) {
          randomOrder = generateRandomOrder(
            pair.buy_price,
            1000,
            9999,
            pair.trading_bot_gap,
            i
          );
          // console.log(randomOrder, "DATA of RANDOM ORDER ")
          randomOrder2 = generateRandomOrder2(
            pair.buy_price,
            1000,
            9999,
            pair.trading_bot_gap,
            i
          );
          // console.log(randomOrder2, "DATA of RANDOM ORDER 2")
        } else if (pair.buy_price > 1 && pair.buy_price < 300) {
          randomOrder = generateRandomOrder(
            pair.buy_price,
            10,
            90,
            pair.trading_bot_gap,
            i
          );
          // console.log(randomOrder, "DATA of RANDOM ORDER ")
          randomOrder2 = generateRandomOrder2(
            pair.buy_price,
            10,
            90,
            pair.trading_bot_gap,
            i
          );
          // console.log(randomOrder2, "DATA of RANDOM ORDER 2")
        } else if (pair.buy_price > 300 && pair.buy_price < 1000) {
          randomOrder = generateRandomOrder(
            pair.buy_price,
            20,
            90,
            pair.trading_bot_gap,
            i
          );
          randomOrder2 = generateRandomOrder2(
            pair.buy_price,
            20,
            90,
            pair.trading_bot_gap,
            i
          );
        } else if (pair.buy_price > 1000 && pair.buy_price < 5000) {
          randomOrder = generateRandomOrder(
            pair.buy_price,
            0.5,
            3,
            pair.trading_bot_gap,
            i
          );
          // console.log(randomOrder, "DATA of RANDOM ORDER ")
          randomOrder2 = generateRandomOrder2(
            pair.buy_price,
            0.5,
            3,
            pair.trading_bot_gap,
            i
          );
          // console.log(randomOrder, "DATA of RANDOM ORDER 2")
        } else if (pair.buy_price > 5000) {
          randomOrder = generateRandomOrder(
            pair.buy_price,
            0.1,
            0.5,
            pair.trading_bot_gap,
            i
          );
          // console.log(randomOrder, "DATA of RANDOM ORDER ")
          randomOrder2 = generateRandomOrder2(
            pair.buy_price,
            0.1,
            0.5,
            pair.trading_bot_gap,
            i
          );
          // console.log(randomOrder, "DATA of RANDOM ORDER 2")
        }

        const order = {};
        order.user_id = "64d6053ef0615d1e6dca0eab" //randomOrder.userId;
        order.order_type = "LIMIT";
        order.base_currency_id = pair.base_currency_id;
        order.quote_currency_id = pair.quote_currency_id;
        order.side = randomOrder.orderType;
        order.price = randomOrder.price || pair.buy_price;
        order.quantity = randomOrder.quantity || 0.5;
        order.order_by = "BOT";

        const orderr = {};
        orderr.user_id = "64d6053ef0615d1e6dca0eab";
        orderr.order_type = "LIMIT";
        orderr.base_currency_id = pair.base_currency_id;
        orderr.quote_currency_id = pair.quote_currency_id;
        orderr.side = randomOrder2.orderType;
        orderr.price = randomOrder2.price || pair.buy_price;
        orderr.quantity = randomOrder2.quantity || 0.5;
        orderr.order_by = "BOT";
        // console.log(order, " : order"), console.log(orderr, " : orderr");

        let order2 = await ExchangeController.place_order_bot(
          order.user_id,
          order
        );
        let order3;
        if (order2) {
          order3 = await ExchangeController.place_order_bot(
            orderr.user_id,
            orderr
          );
        }
        await WalletController.updateAllBalance(
          "64d6053ef0615d1e6dca0eab",
          500000000
        );
        // console.log(order, " : order")
        // console.log(orderr, " : orderr")
        await OrderbookController.deleteBuyOrderForBot(
          pair,
          "BOT",
          "BUY",
          "FILLED"
        );

        await OrderbookController.deleteSellOrderForBot(
          pair,
          "BOT",
          "SELL",
          "FILLED"
        );

        await OrderbookController.deleteNegativeOrderForBot(
          pair,
          "BOT",
          "FILLED"
        );

        // Define the time threshold (3 hours ago)
        const threeHoursAgo = new Date(Date.now() - 3 * 60 * 60 * 1000);
        await OrderbookController.deletePastOrderByBot(threeHoursAgo, "BOT");
        await new Promise((resolve) => {
          setTimeout(() => {
            // console.log(`we have processed the ${pair.base_currency} in settimeout`);
            resolve();
          }, 20000);
        });
      }
    }
    return true;
  } catch (error) {
    console.log(error, " : some error occured in trading bot");
  }
};

module.exports = trading_bot;
