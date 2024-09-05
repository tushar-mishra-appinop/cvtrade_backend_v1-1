const UserController = require('./UserController')
const CurrencyController = require('./CurrencyController')
const WalletController = require('./WalletController');
const ExchangeController = require('./ExchangeController')
const EngineController = require('./EngineController');
const AdminController = require('./AdminController')
const TransactionController = require('./TransactionController')
const P2PController = require('./P2PController');
const SupportController = require('./SupportController');
const MessengerController = require('../controllers/MessengerController');
const OrderbookController = require('./Orderbook');
const BannerController = require('./BannerController');


module.exports = {
    UserController,
    CurrencyController,
    WalletController,
    ExchangeController,
    EngineController,
    AdminController,
    TransactionController,
    P2PController,
    SupportController,
    MessengerController,
    OrderbookController,
    BannerController
}