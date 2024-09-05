const http = require('http');
const socketIO = require('socket.io');
const walletController = require('../controllers').WalletController
const currencyController = require('../controllers').CurrencyController
const EngineController = require('../controllers').EngineController;
const schedule = require('node-schedule');
const { get_message_socket, send_message_socket } = require('../controllers/MessengerController');

let marketdata;
let exchange_data;

const exchange_data_func = async (quote_currency_id, base_currency_id, cursor, limit, userId) => {
    let exchangedata = {

        pairs: await currencyController.all_pairs(),
        // hours24chnages: await EngineController.hours24Changes(quote_currency_id, base_currency_id),
        ticker: await EngineController.ticker(base_currency_id, quote_currency_id, Number(cursor), 1),
        buy_order: await EngineController.both_currency_buy_orders_cache(base_currency_id, quote_currency_id, false),
        sell_order: await EngineController.both_currency_sell_orders_cache(base_currency_id, quote_currency_id, false),
        recent_trades: await EngineController.recent_trade_cached_data(base_currency_id, quote_currency_id, false),

        open_orders: await EngineController.open_order(userId, base_currency_id, quote_currency_id),
        balance: {
            base_currency_balance: await walletController.wallet_balance(userId, base_currency_id) || 0,
            quote_currency_balance: await walletController.wallet_balance(userId, quote_currency_id) || 0
        },
        quote_currency_id: quote_currency_id,

        base_currency_id: base_currency_id,

    }
    return exchangedata;
}

const market_data = async () => {
    let marketdata = {
        pairs: await currencyController.all_pairs(),
        hot: await currencyController.hot_pairs(),
        new_listed: await currencyController.new_listed()
    }
    return marketdata
}

const getP2pChatMessages = async (userId, frnId, order_id) => {
    const messages = await get_message_socket(userId, frnId, order_id)
    return messages
};

const sleep = async (ms) => {
    sleep()
    return new Promise((resolve) => setTimeout(resolve, ms));
}

module.exports = {
    inititate: (app) => {
        const server = http.createServer(app);
        const io = socketIO(server, { cors: { origin: '*' } });
        return { server, io };
    },

    connect: async (io) => {
        // Socket. io 
        io.on('connection', async (socket) => {
            let quote_currency_id;
            let base_currency_id;
            let socketId;
            let cursor;
            let limit;
            let userId;
            let interval;
            socket.on('message', async (data) => {
                quote_currency_id = data.quote_currency_id;
                base_currency_id = data.base_currency_id
                socketId = data.socketId
                cursor = data.cursor || 0
                limit = Number(cursor) + 1
                userId = data.userId

                if (data.message === 'market') {
                    marketdata = await market_data()

                    socket.emit('message', marketdata)
                } else if (data.message === 'exchange') {
                    socket.join(`exchange-${socketId}`);
                    // exchange_data = await exchange_data_func(quote_currency_id, base_currency_id, cursor, limit, userId)
                    io.to(`exchange-${socketId}`).emit('message', await exchange_data_func(quote_currency_id, base_currency_id, cursor, limit, userId));
                    // socket.emit('message', exchange_data)
                }

                // ******* P2P Socket Chat Connection*********
                else if (data.type === "send-message") {
                    const { senderName, recieverId, message, order_id, userId } = data
                    await send_message_socket(senderName, recieverId, message, order_id, userId)
                    const chatMessages = await getP2pChatMessages(userId, frnId, order_id)
                    socket.emit('message', chatMessages)
                }

                else if (data.message === "chat") {
                    const { userId, frnId, order_id } = data;
                    const chatMessages = await getP2pChatMessages(userId, frnId, order_id)
                    socket.emit('message', chatMessages)

                    if (interval) {
                        clearInterval(interval);
                    }
                    interval = setInterval(async () => {
                        const chatMessages = await getP2pChatMessages(userId, frnId, order_id)
                        socket.emit('message', chatMessages)
                    }, 3000);


                }
            })

            socket.on('disconnect', () => {
                console.log('A user is disconnected with id : ', socket.id)
            });
        });
    },
}
