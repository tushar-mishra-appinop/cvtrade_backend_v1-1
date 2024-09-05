const axios = require("axios");
const Pairs = require('../models/Pairs')
const Tickers = require('../models/Ticker');
const EngineController = require('../controllers/EngineController')
require('dotenv').config({ path: '../src/config/.env' });
const config = require("../config/config");
const { ENV } = process.env;
require("../db/mongoose")(config["databases"][ENV])
const { matchOrder } = require('./BullMqWorker')
const trading_bot = require('./TradingBot');

const EventEmitter = require('node:events');
const { updateLocalPairPrice } = require("../controllers/CurrencyController");
class MyEmitter extends EventEmitter { }
const myEmitter = new MyEmitter();
const localPriceEmitter = new MyEmitter();

const WebSocket = require('ws');
const { logIntoLogs } = require("./Utils");
const binanceEndpoint = 'wss://stream.binance.com:9443/stream?streams=';

const calculateOHLC = async (trades, price, latestTicker) => {

  let ticker = latestTicker[0]
  if (trades.length > 0) {
    const prices = trades.map((trade) => trade?.price || 0);
    const high = Math.max(...prices, ticker.high);
    const low = Math.min(...prices, ticker.low);
    const open = ticker.open;
    const price2 = trades[0].price
    const close = trades?.reverse()[trades.length - 1].price;
    const volume = trades[0].quantity
    return { high: high || 0, low: low || 0, open: open || 0, close: close || 0, price: price2 || 0, volume: volume || 0 };
  } else {
    return { high: price || 0, low: price || 0, open: price || 0, close: price || 0, price: price || 0, volume: 0 };
  }
}

function getStartOfMinute(timestamp) {
  const date = new Date(timestamp);
  date.setSeconds(0, 0);
  return date.getTime();
};


//update price global 

const update_price_global = async () => {
  try {
    // console.log("runing global function");
    let coins = await Pairs.find({ status: "Active", available: "GLOBAL" });
    for await (const coin of coins) {
      let currentTime = getStartOfMinute(new Date().getTime())
      let check;
      try {
        check = await axios.get(`https://api.binance.com/api/v3/ticker/24hr?symbol=${coin.base_currency}${coin.quote_currency}`);
      } catch (error) {
        // console.log(`Price of ${coin.base_currency}/${coin.quote_currency} Not Found on Binance!!`)
        continue
      }

      let price = check.data;
      if (price.symbol != undefined) {
        await Pairs.updateOne({
          $and: [
            { base_currency_id: coin.base_currency_id },
            { quote_currency_id: coin.quote_currency_id },
          ],
        },
          {
            $set: {
              buy_price: parseFloat(price.askPrice),
              sell_price: parseFloat(price.askPrice),
              volume: parseFloat(price.volume) / 6,
              high: parseFloat(price.highPrice),
              low: parseFloat(price.lowPrice),
              open: parseFloat(price.openPrice),
              change: parseFloat(price.priceChange),
              change_percentage: (parseFloat(price.priceChangePercent)).toFixed(3),
              close: 0,
              available: "GLOBAL"
            },
          },
          { upsert: true })
      };

      await Tickers.updateOne(
        {
          base_currency_id: coin.base_currency_id,
          quote_currency_id: coin.quote_currency_id,
        },
        {
          $set: {
            base_currency: coin.base_currency,
            quote_currency: coin.quote_currency,
            open: parseFloat(price.openPrice),
            low: parseFloat(price.lowPrice),
            high: parseFloat(price.highPrice),
            close: parseFloat(price.askPrice),
            volume: parseFloat(price.volume) / 6,
            time: currentTime,
          }
        },
        { upsert: true }
      )

    }
    return true
  } catch (error) {
    console.log(error.message, " : error occured!!");
  }
};

// Function to calculate the price based on supply and demand
const update_price_local = async () => {
  try {
    let coins = await Pairs.find({ available: "LOCAL", status: "Active" });

    for await (const coin of coins) {
      try {

        const currentTime = new Date().getTime()
        const hour24volume = await EngineController.find_volume(coin.base_currency_id, coin.quote_currency_id);

        let tradeData = await EngineController.recent_trade_price(coin.base_currency_id, coin.quote_currency_id, currentTime);

        const latestTicker = await Tickers.find({ $and: [{ base_currency_id: coin.base_currency_id }, { quote_currency_id: coin.quote_currency_id }] }).sort({ createdAt: -1 }).limit(1)

        const ohlcData = await calculateOHLC(tradeData, coin.buy_price, latestTicker);

        const high_low_24_hour = await Tickers.aggregate(
          [
            {
              $match: {
                base_currency_id:
                  coin.base_currency_id,
                quote_currency_id:
                  coin.quote_currency_id,
                updatedAt: {
                  $gte: new Date(
                    Date.now() - 24 * 60 * 60 * 1000
                  )
                }
              }
            },
            {
              $group: {
                _id: null,
                highPrice: { $max: "$high" },
                lowPrice: { $min: "$low" }
              }
            }
          ]
        );

        const ticker_Last_24_hour = await Tickers.aggregate(
          [
            {
              $match: {
                base_currency_id:
                  coin.base_currency_id,
                quote_currency_id:
                  coin.quote_currency_id,
                updatedAt: {
                  $gte: new Date(
                    Date.now() - 24 * 60 * 60 * 1000
                  )
                }
              }
            },
            {
              $sort: { updatedAt: 1 }
            },
            {
              $limit: 1
            }
          ]
        );

        let ticker = {
          base_currency_id: coin.base_currency_id,
          quote_currency_id: coin.quote_currency_id,
          base_currency: coin.base_currency,
          quote_currency: coin.quote_currency,
          open: ohlcData.open,
          low: ohlcData.low,
          high: ohlcData.high,
          close: ohlcData.close,
          volume: hour24volume,
          time: getStartOfMinute(currentTime),
        };

        await Tickers.updateOne(
          {
            base_currency_id: ticker.base_currency_id,
            quote_currency_id: ticker.quote_currency_id,
            time: ticker.time / 1000,
          },
          {
            $set: {
              base_currency: ticker.base_currency,
              quote_currency: ticker.quote_currency,
              open: parseFloat(ticker.open),
              low: parseFloat(ticker.low),
              high: parseFloat(ticker.high),
              close: parseFloat(ticker.close),
              volume: parseFloat(ticker.volume),
              time: ticker.time / 1000,
            }
          },
          { upsert: true }
        );

        await updateLocalPairPrice(coin, ohlcData, hour24volume, "LOCAL", high_low_24_hour[0] || {}, ticker_Last_24_hour[0] || {});
      } catch (error) {
        continue
      }
    }

    return true;
  } catch (error) {
    console.log(` Error while updating local pair price ${error.message}`);
  }
}

const startWebSocket = async () => {
  try {
    const coins = await Pairs.find({ status: "Active", available: "GLOBAL" });
    const streams = coins.map(coin => `${coin.base_currency.toLowerCase()}${coin.quote_currency.toLowerCase()}@ticker`);
    const pairWithId = coins.map(coin => ({ pair: `${coin.base_currency.toLowerCase()}${coin.quote_currency.toLowerCase()}@ticker`, base_id: coin?.base_currency_id, quote_id: coin?.quote_currency_id }));

    const combinedStreamUrl = `${binanceEndpoint}${streams.join('/')}`;
    const ws = new WebSocket(combinedStreamUrl);

    ws.on('open', () => {
      console.log('WebSocket connection opened to Binance.');
    });

    ws.on('message', async (data) => {
      const message = JSON.parse(data);
      if (message.stream) {
        // console.log("🚀 ~ ws.on ~ message:", message.data)
        let pair = `${message.data.s.toLowerCase()}@ticker`
        let ids = pairWithId?.filter((item) => item?.pair === pair)[0]
        await handleTickerData(message.data, ids);
      }
    });

    ws.on('ping', (data) => {
      logIntoLogs(`WebSocket Pong Sent ...`)
      ws.pong(); // Properly respond to the ping
    });

    ws.on('error', (error) => {
      logIntoLogs(`WebSocket error ${error}.`)
      console.error('WebSocket error:', error);
    });

    ws.on('close', () => {
      logIntoLogs(`WebSocket connection closed. Reconnecting...`)
      console.log('WebSocket connection closed. Reconnecting...');
      setTimeout(startWebSocket, 10000); // Reconnect after a short delay
    });
  } catch (error) {
    console.error("Failed to start WebSocket:", error.message);
  }
};

const handleTickerData = async (price, ids) => {
  console.log("🚀 ~ handleTickerData ~ ids:", ids)
  if (!price || !price.s) return; 
  const { base_id, quote_id } = ids
  try {
    const updateResult = await Pairs.updateOne(
      {
        base_currency_id: base_id,
        quote_currency_id: quote_id,
        available: "GLOBAL"
      },
      {
        $set: {
          buy_price: parseFloat(price.c),
          sell_price: parseFloat(price.c),
          volume: parseFloat(price.v) / 6,
          high: parseFloat(price.h),
          low: parseFloat(price.l),
          open: parseFloat(price.o),
          change: parseFloat(price.p),
          change_percentage: parseFloat(price.P).toFixed(3),
          close: parseFloat(price.c),
          available: "GLOBAL"
        },
      },
      { upsert: true }
    );

    if (updateResult.modifiedCount > 0 || updateResult.upsertedCount > 0) {
      console.log(`Updated pair ${price.s} data in database.`);
    }

    // Update Tickers collection
    await Tickers.updateOne(
      {
        base_currency_id: base_id,
        quote_currency_id: quote_id
      },
      {
        $set: {
          open: parseFloat(price.o),
          low: parseFloat(price.l),
          high: parseFloat(price.h),
          close: parseFloat(price.c),
          volume: parseFloat(price.v) / 6,
          time: getStartOfMinute(new Date().getTime())
        }
      },
      { upsert: true }
    );

  } catch (error) {
    logIntoLogs(`handleTickerData : Failed to update data for ${price.s}: ${error.message}`)
    console.error(`Failed to update data for ${price.s}: ${error.message}`);
  }
};




process.on('message', async () => {

  startWebSocket();

  const handleUpdateLocalPrice = async () => {
    const local = await update_price_local();
    if (local) {
      await new Promise((resolve) => {
        setTimeout(() => {
          localPriceEmitter.emit('updateLocalprice');
          resolve();
        }, 5000);
      });
    }
  };

  // const handleUpdateGlobalPrice = async () => {
  //   const global = await update_price_global();
  //   await trading_bot()
  //   if (global) {
  //     await new Promise((resolve) => {
  //       setTimeout(() => {
  //         myEmitter.emit('updateprice');
  //         resolve();
  //       }, 20000);
  //     });
  //   }
  // };

  // myEmitter.on('updateprice', handleUpdateGlobalPrice);
  localPriceEmitter.on('updateLocalprice', handleUpdateLocalPrice);

  myEmitter.emit('updateprice');
  localPriceEmitter.emit('updateLocalprice');
  await matchOrder(true)


})


process.on('disconnect', async () => {
  console.log('Child process is disconnected. Exiting in trading bot...');
  process.stdin.pause();
  process.kill(process.pid);
  await matchOrder(false)
  // process.kill();
  process.exit(0);
});

