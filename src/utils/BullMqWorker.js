const { Worker } = require('bullmq')
const { PROJECT_NAME } = process.env
const Pairs = require('../models/Pairs')
const EngineController = require('../controllers').EngineController
const Orderbook = require('../models/Orderbook')
const engineFifo = require('./EngineFifo')
const { errorHandler } = require('../utils/CustomError')
const { create_trade_transaction } = require('../controllers/EngineController')
const { update_price_local } = require('../utils/UpdatePrice')
const EventEmitter = require('node:events');
class MyEmitter extends EventEmitter { }
const myEmitter = new MyEmitter();
// Define your Redis connection options
const connectionOptions = {
    connection: {
        host: '127.0.0.1',
        port: '6379'
    }
};
const { Queue } = require('bullmq');

const orderqueue = new Queue(`${PROJECT_NAME}_order-queue`, {
    connection: {
        host: '127.0.0.1',
        port: '6379'
    }
});

const fs = require('fs');
const path = require('path');

const rootDirectory = path.resolve(__dirname, '..');

const logFilePath = path.join(rootDirectory, 'queue_log.txt');

const logToFile = (message) => {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] ${message}\n`;

    fs.appendFile(logFilePath, logMessage, (err) => {
        if (err) {
            console.error('Error writing to log file:', err);
        }
    });
};

async function matchOrder(shouldrun) {
    try {
        const worker = new Worker(`${PROJECT_NAME}_order-queue`, async (job) => {
            // If shouldrun is false, close the worker
            if (!shouldrun) {
                await worker.close();
                console.log("Worker has been gracefully shut down.");
            }

            const updatedStatsMessage = `Queue Stats After Cleanup:
                    Waiting: ${await orderqueue.getWaitingCount()},
                    Active: ${await orderqueue.getActiveCount()},
                    Completed: ${await orderqueue.getCompletedCount()},
                    Failed: ${await orderqueue.getFailedCount()}`;
            logToFile(updatedStatsMessage);

            const data = job.data;


            const order = await Orderbook.create(data);
            console.log("🚀 ~ worker ~ order:", order)
            let executed;
            if (order) {
                executed = await engineFifo(order);

                if (executed) {
                    let find_order = await await Orderbook.findOne({ _id: order._id });

                    if (find_order) {
                        if ((find_order.remaining === 0) && (find_order.quantity === find_order.filled)) {
                            const updatedOrder = await Orderbook.findOneAndUpdate(
                                { _id: find_order._id },
                                { status: 'FILLED', remaining: 0 },
                                { new: true }
                            );
                            console.log("Order filled:", updatedOrder);
                        }
                    }
                }

                if (order.order_by === 'BOT') {
                    let side = Math.random() < 0.5 ? 'BUY' : 'SELL';
                    let find_order = await Orderbook.findOne({ _id: order._id });
                    let coinpair = await Pairs.findOne({ base_currency_id: find_order.base_currency_id, quote_currency_id: find_order.quote_currency_id });

                    let trade_transaction = {
                        order_id: find_order._id,
                        user_id: find_order.user_id,
                        currency: find_order.ask_currency,
                        base_currency_id: find_order.base_currency_id,
                        quote_currency_id: find_order.quote_currency_id,
                        quantity: order.quantity,
                        side: side,
                        order_type: find_order.order_type,
                        price: coinpair.buy_price,
                        fee: order.maker_fee,
                        order_by: 'BOT'
                    };

                    console.log(trade_transaction, " :, trade_transaction");
                    await create_trade_transaction(trade_transaction);
                }

                let sellOrd = await EngineController.both_currency_sell_orders(data.base_currency_id, data.quote_currency_id, true);
                if (sellOrd) {
                    let buyOrd = await EngineController.both_currency_buy_orders(data.base_currency_id, data.quote_currency_id, true);
                    if (buyOrd) {
                        await EngineController.recent_trade(data.base_currency_id, data.quote_currency_id, true);
                    }
                }

                // Worker event listeners for completed and failed jobs
                worker.on('completed', async (job) => {
                    await job.remove();
                    let message = `Job ${job.id} completed and removed.`
                    logToFile(message);
                    console.log(`Job ${job.id} completed and removed.`);
                });

                worker.on('failed', (job, err) => {
                    let message = `Job ${job.id} Failed.`
                    logToFile(message);
                    console.error(`Job ${job.id} has failed with ${err.message}`);
                });

            } else {
                throw new Error("Order could not be created.");
            }
        }, { connection: connectionOptions });


        return worker;
    } catch (error) {
        console.log("Error in matchOrder function:", error.message);
        throw await errorHandler(error.message, 500);
    }
}

module.exports = {
    matchOrder
}
