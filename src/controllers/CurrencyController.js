const Currency = require('../models/Currency')
const CurrencyPairs = require('../models/Pairs');
// const { create_wallet } = require('./WalletController')
const { verify_bep20_token } = require('../utils/VerifyContractAddress');
const { errorHandler } = require('../utils/CustomError');
const fetch = require('node-fetch');
const apiKey = '6d5907e4-7ee3-457c-8087-d5df06368371'
const axios = require('axios');
module.exports = {
  all_pairs: async () => {
    try {
      pairs = await CurrencyPairs.find({ status: "Active" }).sort({
        createdAt: 1,
      });
      return pairs;
    } catch (error) {
      console.log(error);
    }
  },

  getPairForBot: async () => {
    try {
      let data = await CurrencyPairs.find({
        trading_bot: true,
        status: "Active",
      });
      return data;
    } catch (error) {
      throw await errorHandler(error.message, 406);
    }
  },

  hot_pairs: async () => {
    try {
      pairs = await CurrencyPairs.find({ status: "Active" });
      return pairs;
    } catch (error) {
      console.log(error);
    }
  },

  new_listed: async () => {
    try {
      pairs = await CurrencyPairs.find({ status: "Active" });
      return pairs;
    } catch (error) {
      console.log(error);
    }
  },

  add_coin: async (req, res) => {
    try {
      let data = req.body;

      if (req.file == undefined) {
        return res.status(403).json({
          success: false,
          message: "please upload coin image",
          data: [],
        });
      }

      data.icon_path = req.file.path;
      data.icon_path = data.icon_path.split("/");
      data.icon_path = data.icon_path[1] + "/" + data.icon_path[2];
      data.short_name = data.short_name.toUpperCase();
      data.chain = JSON.parse(data.chain);

      

      let exists = await Currency.find({
        contract_address: data.contract_address,
      });

      if (exists.length > 0) {
        return res.status(403).json({
          success: false,
          message: "coin with this smart contract address already exists",
          data: [],
        });
      }

      // Check if token is valid or not on its respected chain
      let check;
      if (data.chain === "BEP20" || data.chain === "BNB") {
        check = await verify_bep20_token(data.contract_address);
        if (check.status != 1) {
          return res.status(404).json({
            success: false,
            message:
              "This is not a valid contract address on BSCSCAN please check",
            data: [],
          });
        }
      }

      let addcoin = await Currency.create(data);

      // add this coin to all users wallet
      // let users = await Users.find();
      // for (let i = 0; i < users.length; i++) {
      //     let wallet = await create_wallet(users[i].id)
      // }
      if (addcoin) {
        return res.status(200).json({
          success: true,
          message: "coin added successfully",
          data: addcoin,
        });
      } else {
        return res.status(403).json({
          success: false,
          message: "some error occured while adding coin",
          data: [],
        });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: error.message, data: [] });
    }
  },

  get_all_coins: async (req, res) => {
    try {
      let list = await Currency.find();
      return res.status(200).json({
        success: true,
        message: "coin list fetched successfully",
        data: list,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: error.message, data: [] });
    }
  },

  create_pairs: async (req, res) => {
    try {
      let data = req.body;

      data.base_currency = data.base_currency.toUpperCase();
      data.quote_currency = data.quote_currency.toUpperCase();

      let coin = await Currency.findOne({ _id: data.base_currency_id });

      data.icon_path = coin.icon_path;
      data.volume = coin.total_supply;
      data.category = coin.category;

      let check = await CurrencyPairs.findOne({
        $and: [
          { base_currency_id: data.base_currency_id },
          { quote_currency_id: data.quote_currency_id },
        ],
      });
      if (check != null) {
        return res
          .status(409)
          .json({ success: false, message: "pair already exists", data: [] });
      } else {
        let create = await CurrencyPairs.create(data);
        if (create) {
          return res.status(200).json({
            success: true,
            message: "pair created successfully",
            data: create,
          });
        } else {
          return res.status(403).json({
            success: false,
            message: "some error occured while creating pair",
            data: [],
          });
        }
      }
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: error.message, data: [] });
    }
  },

  get_all_pairs: async (req, res) => {
    try {
      let pairs = await CurrencyPairs.find().sort({ createdAt: 1 });
      return res.status(200).json({
        success: true,
        message: "pair list fetched successfully",
        data: pairs,
      });
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: error.message, data: [] });
    }
  },

  get_currency_details: async (req, res) => {
    try {
      const { currency_id } = req.body;
      let details = await Currency.findOne({ _id: currency_id });

      if (details != null) {
        return res.status(200).json({
          success: true,
          message: "currency details fetched successfully",
          data: details,
        });
      } else {
        return res.status(200).json({
          success: false,
          message: "no details found for this currency",
          data: [],
        });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: error.message, data: [] });
    }
  },

  edit_currency: async (req, res) => {
    try {
      const data = req.body;
      let coin = await Currency.findOne({ _id: data._id });
      let path;
      if (req.file != undefined) {
        path = `icons/${req.file.filename}`;
      } else {
        path = coin.icon_path;
      }

      if (coin === null) {
        return res
          .status(406)
          .json({ success: false, message: "no currency found with this id" });
      }

      let update = await Currency.updateOne(
        { _id: data._id },
        {
          $set: {
            icon_path: path || coin.icon_path,
            maker_fee: data.maker_fee || coin.maker_fee,
            taker_fee: data.taker_fee || coin.taker_fee,
            min_withdrawal: data.min_withdrawal || coin.min_withdrawal,
            max_withdrawal: data.max_withdrawal || coin.max_withdrawal,
            min_deposit: data.min_deposit || coin.min_deposit,
            max_deposit: data.max_deposit || coin.max_deposit,
            transaction_fee: data.transaction_fee || coin.transaction_fee,
            withdrawal_fee: data.withdrawal_fee || coin.withdrawal_fee,
            total_supply: data.total_supply || coin.total_supply,
            tds: data.tds || coin.tds,
            category: data.category || coin.category,
            deposit_status: data.deposit_status || "ACTIVE",
            withdrawal_status: data.withdrawal_status || "ACTIVE",
            p2p: data.p2p || false,
          },
        },
        { upsert: true }
      );

      let update_pair = await CurrencyPairs.updateMany(
        { base_currency_id: data._id },
        {
          $set: {
            icon_path: path || coin.icon_path,
          },
        },
        { upsert: true }
      );

      if (update.upsertedCount > 0 || update.modifiedCount > 0) {
        return res.status(200).json({
          success: true,
          message: "coin details updated successfully",
          data: [],
        });
      } else {
        return res.status(406).json({
          success: true,
          message: "some error occured while updating details in database",
          data: [],
        });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: error.message, data: [] });
    }
  },

  p2p_list: async (req, res) => {
    try {
      let find_coins = await Currency.find({ p2p: true });
      if (find_coins.length > 0 || find_coins) {
        return res.status(200).json({
          success: true,
          message: "P2P Coin list fetched",
          data: find_coins,
        });
      } else {
        return res.status(500).json({
          success: false,
          message: "No Currency added in P2P list",
          data: [],
        });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: error.message, data: [] });
    }
  },

  delete_pair: async (req, res) => {
    try {
      const { _id, status } = req.body;
      let remove = await CurrencyPairs.updateOne(
        { _id: _id },
        { $set: { status: status } }
      );
      if (remove) {
        return res.status(200).json({
          success: true,
          message: "Pair Removed Successfully",
          data: [],
        });
      } else {
        return res
          .status(406)
          .json({ success: false, message: "Some error occured", data: [] });
      }
    } catch (error) {
      return res
        .status(500)
        .json({ success: false, message: error.message, data: [] });
    }
  },

  // bot_status: async (req, res) => {
  //     try {
  //         const { _id, status, gap } = req.body;
  //         let update = await CurrencyPairs.updateOne({ _id: _id }, { $set: { trading_bot: status, trading_bot_gap: gap } })
  //         if (update.upsertedCount > 0 || update.modifiedCount > 0) {
  //             if (status == true) {
  //                 return res.status(200).json({ success: true, message: 'Bot Started Successfully', data: [] })
  //             } else {
  //                 return res.status(200).json({ success: true, message: 'Bot Stopped Successfully', data: [] })
  //             }
  //         } else {
  //             return res.status(406).json({ success: false, message: 'Some error occured', data: [] })
  //         }
  //     } catch (error) {
  //         return res.status(500).json({ success: false, message: error.message, data: [] })
  //     }
  // },

  bot_status: async (req, res) => {
    try {
      const { ids, status, gap } = req.body;

      // Validate input
      if (!Array.isArray(ids) || ids.length === 0) {
        return res.status(400).json({
          success: false,
          message: "IDs must be an array and should not be empty",
          data: [],
        });
      }

      let updateResults = await Promise.all(
        ids.map(async (_id) => {
          return await CurrencyPairs.updateOne(
            { _id: _id },
            { $set: { trading_bot: status, trading_bot_gap: gap } }
          );
        })
      );

      let successCount = updateResults.filter(
        (result) => result.modifiedCount > 0
      ).length;
      let upsertCount = updateResults.filter(
        (result) => result.upsertedCount > 0
      ).length;

      if (successCount > 0 || upsertCount > 0) {
        if (status === true) {
          return res.status(200).json({
            success: true,
            message: `Bot started successfully for ${successCount + upsertCount
              } pairs`,
            data: [],
          });
        } else {
          return res.status(200).json({
            success: true,
            message: `Bot stopped successfully for ${successCount + upsertCount
              } pairs`,
            data: [],
          });
        }
      } else {
        return res.status(406).json({
          success: false,
          message: "Some error occurred, no pairs were updated",
          data: [],
        });
      }
    } catch (error) {
      return res.status(500).json({
        success: false,
        message: error.message,
        data: [],
      });
    }
  },

  // Replace 'YOUR_API_KEY' with your actual API key from CoinMarketCap

  get_top_gl: async (req, res) => {
    try {
      // Fetch top gainers
      const gainersResponse = await fetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest?limit=500&sort=percent_change_24h&convert=USD`,
        {
          headers: {
            "X-CMC_PRO_API_KEY": apiKey,
          },
        }
      );
      const gainersData = await gainersResponse.json();
    
      const topGainers = gainersData.data.filter(
        (coin) =>
          coin.quote.USD.percent_change_24h > 0
        // coin.quote.USD.percent_change_24h < 20 &&
        // coin.quote.USD.market_cap > 2000
      );

      
      // Fetch top losers
      const losersResponse = await fetch(
        `https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest`,
        {
          headers: {
            "X-CMC_PRO_API_KEY": apiKey,
          },
        }
      );

      const losersData = await losersResponse.json();
      
      const topLosersData = losersData.data.filter(
        (coin) => coin.quote.USD.percent_change_24h < 0
      );
      const topLosers = topLosersData
        .sort((a, b) => a.quote.USD.percent_change_24h - b.quote.USD.percent_change_24h)
        .slice(0, 10); // Get top 10 by volume

      res.status(200).json({ topGainers, topLosers });
    } catch (error) {
      res.status(500).json({ error: error.message });
    }
  },

  get_top_tr: async (req, res) => {
    try {
      const response = await axios.get(
        "https://pro-api.coinmarketcap.com/v1/cryptocurrency/listings/latest",
        {
          headers: {
            "X-CMC_PRO_API_KEY": "6d5907e4-7ee3-457c-8087-d5df06368371",
            Accept: "application/json",
          },
          params: {
            start: 1,
            limit: 20,
            convert: "USD",
          },
        }
      );

      const data = response.data.data;

      // Assuming trending means high volume and significant price change
      const trending = data
        .sort((a, b) => b.quote.USD.volume_24h - a.quote.USD.volume_24h)
        .slice(0, 10); // Get top 10 by volume

      let test = [];
      trending.forEach((crypto) => {
        const coinDetails = {
          id: crypto.id,
          name: crypto.name,
          symbol: crypto.symbol,
          num_market_pairs: crypto.num_market_pairs,
          total_supply: crypto.total_supply,
          circulating_supply: crypto.circulating_supply,
          price: crypto.quote.USD.price,
          change_24h: crypto.quote.USD.percent_change_24h,
        };
        test.push(coinDetails);
      });
      
      res.json({ success: true, data: test });
    } catch (error) {
      console.error("Error fetching top trending tokens:", error.message);
      res.status(500).json({ success: false, error: "Internal Server Error" });
    }
  },

  updateLocalPairPrice: async (coin, ohlcData, circulating_volume, available, high_low_24_hour = {}, ticker_Last_24_hour = {}) => {
    let changedPrice = ohlcData.close - ticker_Last_24_hour?.close;
    let currentPrice = ohlcData.close
    let changePercantage = (changedPrice / currentPrice) * 100
    try {
      let data = await CurrencyPairs.updateOne(
        {
          $and: [
            { base_currency_id: coin.base_currency_id },
            { quote_currency_id: coin.quote_currency_id },
          ],
        },
        {
          $set: {
            buy_price: ohlcData.close || 0,
            sell_price: ohlcData.close || 0,
            volume: circulating_volume || 0,
            high: high_low_24_hour?.highPrice || 0,
            low: high_low_24_hour?.lowPrice || 0,
            open: ohlcData.open || 0,
            close: ohlcData.close || 0,
            change: parseFloat(changedPrice.toFixed(6)) || 0,
            change_percentage: parseFloat(changePercantage.toFixed(6)) || 0,
            available: available
          },
        },
        { upsert: true }
      );

    } catch (error) {
      throw Error(error.message, 406)
    }
  },

};