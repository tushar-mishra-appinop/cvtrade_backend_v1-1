const express = require('express');
const fs = require('fs');
const path = require('path');
const cors = require('cors');
const EventEmitter = require('node:events');
class MyEmitter extends EventEmitter { }
const myEmitter = new MyEmitter();
require('dotenv').config({ path: './src/config/.env' });

const app = express();
const { connect, inititate } = require("./config/Ws.js");

const { PORT, ENV } = process.env
const config = require("./config/config");
const morgan = require('morgan')

// connect database
require("./db/mongoose")(config["databases"][ENV]);

const swappingRouter = require('./routes/SwappingRouter');
const userRouter = require('./routes/UserRouter');
const walletRouter = require('./routes/WalletRouter')
const currencyRouter = require('./routes/CurrencyRouter');
const exchangeRouter = require('./routes/ExchangeRouter');
const adminRouter = require('./routes/AdminRouter');
const transactionRouter = require('./routes/TransactionRoutes');
const supportRouter = require('./routes/SupportRouter.js')
const P2PRouter = require('./routes/P2PRouter');
const MessengerRouter = require('./routes/MessengerRouter');
const BannerRouter = require('./routes/BannerRouter');
const partnershipLoginRouter = require('./routes/patnershipRouter.js');
const transferRouter = require('./utils/transfer.js');
const errorLogger = require('./utils/ErrorLogger');
const { transfer_funds } = require('./controllers/Blockchain')
const { transfer_fundsTRC20 } = require('./controllers/Blockchain')

const { server, io } = inititate(app);
const schedule = require('node-schedule');
const { clearLogs } = require('./utils/Utils.js');
app.use(express.json({ limit: '25mb' }))
app.use(express.urlencoded({ limit: '25mb', extended: true, parameterLimit: 20000000 }))
app.use((req, res, next) => {
    res.header('Access-Control-Allow-Origin', '*');
    next()
})
app.use(cors());


// Morgan for logger
let accessLogStream = fs.createWriteStream(path.join(__dirname, 'requests.log'))
morgan.token('body', (req, res) => JSON.stringify(req.body))
app.use(morgan(':url :status :method :body :res[content-length] - :response-time ms', { stream: accessLogStream }))

app.use(express.static('assets'))
app.use(express.static('public'))
app.use([userRouter, errorLogger]);
app.use([currencyRouter, errorLogger]);
app.use([exchangeRouter, errorLogger]);
app.use([adminRouter, errorLogger]);
app.use([walletRouter, errorLogger]);
app.use([transactionRouter, errorLogger]);
app.use([P2PRouter, errorLogger]);
app.use([supportRouter, errorLogger])
app.use([MessengerRouter, errorLogger]);
app.use([BannerRouter, errorLogger]);
app.use([partnershipLoginRouter, errorLogger]);
app.use([transferRouter, errorLogger]);
app.use([swappingRouter, errorLogger]);


// Clear Logs
clearLogs()


schedule.scheduleJob('0 */2 * * *', async () => {
    console.log("Now cron is running for transfer funds");
    await transfer_funds();
});


schedule.scheduleJob('0 */2 * * *', async () => {
    console.log("Now cron is running for transfer funds");
    await transfer_fundsTRC20();
});



server.listen(PORT, () => {
    connect(io)
    const { fork } = require("child_process");
    const childProcess2 = fork('./src/utils/UpdatePrice.js');
    childProcess2.send({ data: 1 })
    childProcess2.on("message", (message) => {
        fs.writeFileSync("child-process-log", "We are hitting in child process on message");
    })
    childProcess2.on('close', (code) => {
        fs.writeFileSync("child-process-log", "We are hitting in child process on close");
        childProcess2.stdin.pause();
        childProcess2.kill('SIGINT');
    });

    childProcess2.on('exit', function () {
        fs.writeFileSync("child-process-log", "We are hitting in child process on exit");
        childProcess2.stdin.pause();
        childProcess2.kill('SIGINT');
    });

    childProcess2.on('error', (err) => {
        fs.writeFileSync("child-process-log", "We are hitting in child processon err" + err.toString());
    });
    childProcess2.on('SIGINT', () => {
        fs.writeFileSync("child-process-log", "We are hitting in child processon sigint");
        childProcess2.send('terminate');
        childProcess2.stdin.pause();
        childProcess2.kill('SIGINT');
        childProcess2.exit(0);
    });

    childProcess2.on('uncaughtException', function (err) {
        fs.writeFileSync("child-process-log", "We are hitting in child processon uncaught exception");
    });

    childProcess2.on('disconnect', () => {
        fs.writeFileSync("child-process-log", "We are hitting in child processon disconnect");
        childProcess2.stdin.pause();
        childProcess2.kill('SIGINT');
        childProcess2.exit(0);
    });

    console.log(`Application is listening on port : `, PORT)
    process.on('uncaughtException', function (err) {
        fs.writeFileSync("child-process-log", "We are hitting in proces uncaughtException");
    });
    process.on('disconnect', () => {
        fs.writeFileSync("child-process-log", "We are hitting in proces disconnect");
        console.log('process disconnected. Exiting...');
        process.stdin.pause();
        process.kill('SIGINT');
        process.exit(0);
    });
    function cleanupChildProcess() {
        fs.writeFileSync("child-process-log", "We are hitting in proces cleanchild process");
        childProcess2.kill('SIGINT');
    }

    process.on('exit', cleanupChildProcess);
    process.on('SIGINT', cleanupChildProcess);

})

