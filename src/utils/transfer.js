const express = require('express');
const router = express.Router();
const Web3 = require("web3");
// const web3 = new Web3("https://data-seed-prebsc-1-s2.bnbchain.org:8545") //RPC of BNB
const web3 = new Web3("https://flashy-hidden-panorama.bsc.quiknode.pro/622014428d46f3aab2d2e512059ff5d185d6d351/") //RPC of BNB
const commonAbi = require('./newBlockchain.json')
const Admin = require('../models/Admin')
const UserAddress = require('../models/UserAddresses')
const Currency = require('../models/Currency');
const { email_marketing } = require('./Marketing');


router.use(express.json());

const MINIMUM_BALANCE = 0.01; // Set your minimum BNB balance,admin should have for gas

router.route('/v1/admin/fund-transfer').post(async function (req, res, next) {

    let receiver_email = req.body.email;
    let TOKEN_NAME = req.body.tokenName;      // token short name
    let chain = req.body.chain;
    console.log(req.body, ": Request Body Data For Fund Transfer");

    let master = await Admin.findOne({ email_or_phone: "admin@cvtrade.exchange" });
    console.log("master:", master);

    let masterId = master._id.toString();
    console.log("masterId:", masterId);

    let adminwallet = await UserAddress.findOne({ $and: [{ user_id: masterId }, { chain: "BEP20" }] });
    console.log("adminwallet:", adminwallet);

    let token = await Currency.findOne({ short_name: TOKEN_NAME })
    // console.log(token, ": Value of Token");

    let tokenAddress = JSON.parse(token.contract_address)

    console.log("token address ==============", tokenAddress['BEP20']);

    const tokenInstance = new web3.eth.Contract(commonAbi, tokenAddress['BEP20']);

    try {

        let balance = await web3.eth.getBalance(adminwallet.address)
        console.log(`Balance of BNB`, balance);
        let bal = await web3.utils.fromWei(balance, "ether")
        console.log("bal", bal)
        if (bal < MINIMUM_BALANCE) {
            //@ if balance is less than MINIMUM_BALANCE send mail
            await email_marketing('blockchain_low_balance', bal, 'joshigkp43690@gmail.com')
            return res.status(500).json({ success: false, message: "Less BNB Balance! Email Triggered", data: [] })
        }
        let receiversAddress = req.body.receiver;  // receiver address
        let amount = req.body.amount;              // amount to transfer like 1 token , 10 token
        let ValueToTransfer = web3.utils.toWei(amount.toString(), 'ether');
        console.log("ValueToTransfer", ValueToTransfer)

        const withdrawal_wallet = await tokenInstance.methods.balanceOf(adminwallet.address).call();
        const withdrawal_wallet_balance = web3.utils.fromWei(withdrawal_wallet, "ether");

        console.log(withdrawal_wallet_balance, 'withdrawal_wallet_balance');
        if (withdrawal_wallet_balance > amount) {
            web3.eth.accounts.wallet.add(adminwallet.private_key);
            tokenInstance.methods.transfer(receiversAddress, ValueToTransfer).send(
                { from: adminwallet.address, gas: 100000 },
                async function (error, result) {
                    if (!error) {
                        let data = {
                            receiver_email : receiver_email,
                            currency: TOKEN_NAME,
                            chain: chain,
                            receiver_address: receiversAddress,
                            withdrawal_amount: amount,
                            transaction_hash: result
                        }
                        await email_marketing('withdrawal_confirmation', amount, receiver_email)
                        console.log(result, " : this is result/Transction hash");
                        res.status(200).json({ success: true, message: "WIthdrawal Successful", data: data });
                    } else {
                        console.log("Error in withdrawal", error.message);
                        res.status(500).send("Error in withdrawal");
                    }
                });
        } else {
            await email_marketing('blockchain_low_balance', withdrawal_wallet_balance, 'joshigkp43690@gmail.com')
            console.log("Not Enough Token Balance");
            return res.status(500).json({ success: false, message: "Low Token Balance! Email Triggered", data: [] })
        }
    } catch (error) {
        console.error("Error in transfer route:", error.message);
        res.status(500).send("Internal Server Error");
    }
});

module.exports = router;
