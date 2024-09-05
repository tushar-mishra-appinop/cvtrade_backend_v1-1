const Web3 = require("web3");
const { commonAbi } = require('./Blockchain.json')
const { BNBRPC } = process.env;
const web3 = new Web3(BNBRPC)
const Currency = require('../models/Currency')
const WalletTransaction = require('../models/WalletTransaction')

const featchingBal = async (address_hotWallet, PrivateKey_hotwallet, token) => {
    try {
        console.log('We are inside featchingBal')
        for await (const tkn of token) {
            let i = 1;
            // console.log(tkn, " : tkn in featchingBal")
            let coins = await Currency.find({
                $or: [
                    { short_name: 'CVT' },
                    // { short_name: 'USDT' }
                ]
            });
            for await (const coin of coins) {
                //  console.log(coin, " : tokenAddress")
                let tokenAddress = (coin.contract_address)
                // console.log(JSON.parse(tokenAddress).BEP20, ": sunilrana token address")
                const tokenInstance = new web3.eth.Contract(commonAbi, JSON.parse(tokenAddress).BEP20);


                try {
                    const record = tkn;
                    // console.log(record.address, " : record.address")
                    const AccountAddress = record.address;
                    console.log(`account address with Index =>${i} =>`, AccountAddress);

                    // const AccountBNBBalance = await web3.eth.getBalance(AccountAddress);
                    const AccountTokenBalance = await tokenInstance.methods
                        .balanceOf(AccountAddress)
                        .call();
                    console.log(
                        `account balance with Index =>${i} =>`,
                        AccountTokenBalance
                    );

                    if (AccountTokenBalance > 0) {
                        console.log(
                            `Inside calculating gas of ${AccountAddress} Index${i}`,
                            AccountTokenBalance
                        );
                        var senderNonce = await web3.eth.getTransactionCount(
                            address_hotWallet
                        );
                        // senderNonce = senderNonce +1;
                        console.log("sender nonce: " + senderNonce);
                        const gasPrice = await web3.eth.getGasPrice();
                        console.log("gasPrice: " + gasPrice);
                        const gasLimit = await tokenInstance.methods
                            .transfer(address_hotWallet, AccountTokenBalance)
                            .estimateGas({ from: AccountAddress });
                        console.log("gasLimit: " + gasLimit); // This is gas required
                        const data = await tokenInstance.methods.transfer(address_hotWallet, AccountTokenBalance).encodeABI()
                        console.log("data: " + data);
                        const fee = (gasLimit * gasPrice) + 10000;
                        try {
                            console.log("inside transfering gas");
                            const txObject = {
                                from: address_hotWallet,
                                to: AccountAddress,
                                value: fee,
                                gas: 21000,
                                gasPrice: gasPrice,
                                nonce: senderNonce,
                            };

                            const signedTx =
                                await web3.eth.accounts.signTransaction(
                                    txObject,
                                    PrivateKey_hotwallet
                                );
                            const receipt = await web3.eth.sendSignedTransaction(
                                signedTx.rawTransaction
                            );

                            console.log("Transaction Hash:", receipt.transactionHash);
                            console.log("Transaction Body:", receipt);
                            let obj = {};
                            obj.user_id = tkn.user_id;
                            obj.currency = coin.short_name;
                            obj.currency_id = coin._id;
                            obj.chain = coin.chain[0];
                            obj.short_name = coin.short_name; 
                            obj.description = "Gas Transfer";
                            obj.transaction_type = "Transfer";
                            obj.transaction_hash = receipt.transactionHash;
                            obj.status = receipt.status;
                            obj.from_address = receipt.from;
                            obj.to_address = receipt.to;
                            obj.fee = '2100'
                            obj.amount= receipt.value;
                            return true
                        } catch (err) {
                            console.log(
                                "Error sending transaction fee:",
                                err.message
                            );
                            return false
                        }
                    }
                } catch (error) {
                    console.log(error, " : error occured");
                }
            }
            i++
        }
        return true
    } catch (error) {
        console.log(error, " : error occured");
    }
}

module.exports = {
    featchingBal
}
