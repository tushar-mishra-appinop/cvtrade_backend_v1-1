const axios = require('axios');
const WalletTransaction = require('../models/WalletTransaction');
const Wallets = require('../models/Wallets');
const { BSCSCAN_API, TRONSCAN_API, POLYGONSCAN_API, ETHERSCAN_API, ARBISCAN_API } = process.env;
const Currency = require('../models/Currency')
// Deposit confirmation for BNB
const verify_bnb_deposit = async (userId, currency, currency_id, chain, short_name, contract_address, address, decimals) => {
    try {
        let url = `https://api.bscscan.com/api?module=account&action=txlist&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc&apikey=${BSCSCAN_API}`;
        let data = await axios.post(url);
        let result = data.data.result;
        let arr = [];
        let trans = await WalletTransaction.find({$and: [{user_id: userId},{transaction_type: 'DEPOSIT'}]});
        arr = trans.map(e => e.transaction_hash);
        arr = arr.reverse();
        console.log(arr, " : all transaction hash");
        if(result.length > 0) {
            for await (const single_result of result) {
                console.log('This transaction already exists or not ? : ', !arr.includes(single_result.hash));
                if ((single_result.to).toLowerCase() === address.toLowerCase() && !arr.includes(single_result.hash)) {
                    let find_transaction = await WalletTransaction.findOne({transaction_hash: single_result.hash});
                    if(find_transaction != null) {
                        continue;
                    }
                    let txObj = {};
                    txObj.user_id = userId;
                    txObj.currency = currency;
                    txObj.currency_id = currency_id;
                    txObj.chain = chain;
                    txObj.short_name = short_name;
                    txObj.amount = single_result.value / 10 ** decimals;
                    txObj.transaction_type = 'DEPOSIT';
                    txObj.transaction_hash = single_result.hash;
                    txObj.status = 'SUCCESS';
                    txObj.from_address = single_result.from;
                    txObj.to_address = single_result.to;

                    // First we have to deposit the amount into user wallet
                    let balance = await Wallets.updateOne(
                        {$and: [{user_id: userId},{currency_id: currency_id}]},
                        {
                            $inc: {
                                balance: txObj.amount
                            }
                        },
                        {upsert: true}
                    );

                    if(balance.upsertedCount > 0 || balance.modifiedCount > 0) {
                        // Second we have to create the transaction for this new transaction
                        await WalletTransaction.create(txObj);
                    }

                }
                
            }
        }
        return true;
    } catch(error) {
        throw new Error(error);
    }
};

// Deposit confirmation for any BEP20 Chain Token
const verify_bep20_token_deposit = async (userId, currency, currency_id, chain, short_name, contract_address, address, decimals, min_deposit, max_deposit) => {
    try {
        console.log("INSIDE BEP20 FUNCTION....");
        // console.log(userId, currency, currency_id, chain, short_name, contract_address, address, decimals, min_deposit, max_deposit);
        console.log(contract_address,"testing by samyak");
        let url = `https://api.bscscan.com/api?module=account&action=tokentx&contractaddress=${contract_address}&address=${address}&page=1&offset=10000&startblock=0&endblock=999999999&sort=dsc&apikey=${BSCSCAN_API}`;
        console.log(url, "URL of External API")
        let data = await axios.get(url);
        // console.log(data, "THIRD PARTY API");
        console.log(data.data, "RESULT DATA");

        let result = data.data.result;
        console.log(result,"result testing of BSCSCAN API");
        let arr = [];
        let trans = await WalletTransaction.find({$and: [{user_id: userId},{transaction_type: 'DEPOSIT'}]});
        arr = trans.map(e => e.transaction_hash);
        arr = arr.reverse();
        console.log('All transaction hash : ', arr);

        // console.log(result, " : of currency : ", currency);
        if(result.length > 0) {
            for await (const single_result of result) {
                let amount = single_result.value / 10 ** decimals;
                
                // Convert both strings to lowercase for comparison
                console.log(single_result, " : single result of : ", currency);
                console.log('transaction already find in DB', arr);
                if ((single_result.to).toLowerCase() === address.toLowerCase() && !arr.includes(single_result.hash)) {
                    console.log(amount, " : amount");
                    console.log(min_deposit, " : min_deposit");
                    console.log(max_deposit, " : max_deposit");
                    let txObj = {};
                    txObj.user_id = userId;
                    txObj.currency = currency;
                    txObj.currency_id = currency_id;
                    txObj.chain = chain;
                    txObj.short_name = short_name;
                    txObj.amount = amount; // Use 'amount' calculated above
                    txObj.transaction_type = 'DEPOSIT';
                    txObj.transaction_hash = single_result.hash;
                    txObj.status = 'SUCCESS';
                    txObj.from_address = single_result.from;
                    txObj.to_address = single_result.to;

                    if(amount >= min_deposit && amount <= max_deposit) {
                        // First we have to deposit the amount into user wallet
                        let balance = await Wallets.updateOne(
                            {$and: [{user_id: userId},{currency_id: currency_id}]},
                            {
                                $inc: {
                                    balance: txObj.amount
                                }
                            },
                            {upsert: true}
                        );
                        console.log(balance, " : balance inside bep20");

                        if(balance.upsertedCount > 0 || balance.modifiedCount > 0) {
                            // Second we have to create the transaction for this new transaction
                            await WalletTransaction.create(txObj);
                        }
                    } else {
                        // console.log("in else");
                    }
                }
            }
        }
        return true;
    } catch(error) {
        console.log(error);
        throw new Error(error);
    }
};

const verify_btc_deposit = async (userId, currency, currency_id, chain, short_name, contract_address, address, decimals) => {
    try {
        let url = `https://api.blockcypher.com/v1/btc/main/addrs/${address}`;
        let data = await axios.get(url);
        let result = data.data.txrefs;
        let arr = [];
        let trans = await WalletTransaction.find({$and: [{user_id: userId},{transaction_type: 'DEPOSIT'}]});
        arr = trans.map(e => e.transaction_hash);
        arr = arr.reverse();
        console.log(`All transaction hash : `, arr);
        if(result.length > 0) {
            for await (const single_result of result) {
                console.log('This transaction already exists or not ? : ', !arr.includes(single_result.hash));
                if (!single_result.spent && !arr.includes(single_result.hash)) {
                    let find_transaction = await WalletTransaction.findOne({transaction_hash: single_result.hash});
                    if(find_transaction != null) {
                        continue;
                    }
                    let txObj = {};
                    txObj.user_id = userId;
                    txObj.currency = currency;
                    txObj.currency_id = currency_id;
                    txObj.chain = chain;
                    txObj.short_name = short_name;
                    txObj.amount = single_result.value / 10 ** decimals;
                    txObj.transaction_type = 'DEPOSIT';
                    txObj.transaction_hash = single_result.tx_hash;
                    txObj.status = 'SUCCESS';
                    txObj.from_address = single_result.from;
                    txObj.to_address = single_result.to;

                    // First we have to deposit the amount into user wallet
                    let balance = await Wallets.updateOne(
                        {$and: [{user_id: userId},{currency_id: currency_id}]},
                        {
                            $inc: {
                                balance: txObj.amount
                            }
                        },
                        {upsert: true}
                    );

                    if(balance.upsertedCount > 0 || balance.modifiedCount > 0) {
                        // Second we have to create the transaction for this new transaction
                        await WalletTransaction.create(txObj);
                    }

                }
                
            }
        }
        return true;
    } catch(error) {
        throw new Error(error);
    }
};

// Deposit confirmation for any TRC20 Chain Token
const verify_trc20_token_deposit = async (userId, currency, currency_id, chain, short_name, contract_address, address, decimals) => {
    try {
        let url = `https://api.trongrid.io/v1/accounts/${address}/transactions/trc20?contract_address=${contract_address}&only_to=true`;
        let data = await axios.get(url);
        // console.log(data.data, " : in trx data");
        let result = data.data.data;
        let arr = [];
        let trans = await WalletTransaction.find({$and: [{user_id: userId},{transaction_type: 'DEPOSIT'}]});
        arr = trans.map(e => e.transaction_hash);
        arr = arr.reverse();
        // console.log('All transaction hash : ', arr);
        if(result.length > 0 && data.data.success) {
            for await (const single_result of result) {
                // console.log('This transaction already exists or not ? : ', !arr.includes(single_result.hash));
                if ((single_result.to).toLowerCase() === address.toLowerCase() && !arr.includes(single_result.hash)) {
                    let find_transaction = await WalletTransaction.findOne({transaction_hash: single_result.hash});
                    if(find_transaction != null) {
                        continue;
                    }
                    let txObj = {};
                    txObj.user_id = userId;
                    txObj.currency = currency;
                    txObj.currency_id = currency_id;
                    txObj.chain = chain;
                    txObj.short_name = short_name;
                    txObj.amount = single_result.value / 10 ** decimals;
                    txObj.transaction_type = 'DEPOSIT';
                    txObj.transaction_hash = single_result.hash;
                    txObj.status = 'SUCCESS';
                    txObj.from_address = single_result.from;
                    txObj.to_address = single_result.to;

                    // First we have to deposit the amount into user wallet
                    let balance = await Wallets.updateOne(
                        {$and: [{user_id: userId},{currency_id: currency_id}]},
                        {
                            $inc: {
                                balance: txObj.amount
                            }
                        },
                        {upsert: true}
                    );

                    if(balance.upsertedCount > 0 || balance.modifiedCount > 0) {
                        // Second we have to create the transaction for this new transaction
                        await WalletTransaction.create(txObj);
                    }

                }
                
            }
        }
        return true;
    } catch(error) {
        throw new Error(error);
    }
};

// Deposit Confirmation for any ERC20 Token on ETH chain
const verify_erc20_token_deposit = async (userId, currency, currency_id, chain, short_name, contract_address, address, decimals) => {
    try {
        let url = `https://api.etherscan.io/api?module=account&action=tokentx&contractaddress=${contract_address}&address=${address}&page=1&offset=10000&startblock=0&endblock=27025780&sort=asc&apikey=${ETHERSCAN_API}`
        let data = await axios.post(url);
        let result = data.data.result;
        let arr = [];

        // Fee to be charged on each deposit by client's choice
        let fee = await Currency.findOne({short_name: short_name});
        console.log(fee.deposit_fee, ": deposit feeeeeeeeeeeeee");
        let dep_fee = fee.deposit_fee;

        let trans = await WalletTransaction.find({$and: [{user_id: userId},{transaction_type: 'DEPOSIT'}]})
        arr = trans.map(e => e.transaction_hash)

        // AMOUNT 
        let amount = result.value / 10 ** decimals;
        // let total_amount = amount - dep_fee
        let total_amount = amount;

        if(result.length > 0) {
            for (let i = 0; i < result.length; i++) {
                if ((result[i].to).toLowerCase() == address.toLowerCase() && !arr.includes(result[i].hash)) {
                    let txObj = {};
                    txObj.user_id = userId;
                    txObj.currency = currency
                    txObj.currency_id = currency_id
                    txObj.chain = chain
                    txObj.fee = dep_fee
                    txObj.short_name = short_name
                    txObj.amount = total_amount
                    txObj.transaction_type = 'DEPOSIT';
                    txObj.transaction_hash = result[i].hash
                    txObj.status = 'PENDING',
                    txObj.from_address = result[i].from
                    txObj.to_address = result[i].to

                    // First we have to deposit the amount into user wallet
                    let balance = await Wallets.updateOne(
                        {$and: [{user_id: userId},{currency_id: currency_id}]},
                        {
                            $inc: {
                                balance: txObj.amount
                            }
                        },
                        {upsert: true}
                    )

                    if(balance.upsertedCount > 0 || balance.modifiedCount > 0) {
                        // Second we have to create the transaction for this new transaction
                        await WalletTransaction.create(txObj)
                    }

                }
                
            }
        }
        return true
    } catch(error) {
        throw new Error(error)
    }
}

// Deposit confirmation for any POLYGON_POS Chain Token
const verify_polygon_token_deposit = async (userId, currency, currency_id, chain, short_name, contract_address, address, decimals) => {
    try {
        let url = `https://api.polygonscan.com/api?module=account&action=tokentx&contractaddress=${contract_address}&address=${address}&startblock=0&endblock=99999999&page=1&offset=10000&sort=asc&apikey=${POLYGONSCAN_API}`
        let data = await axios.post(url);
        let result = data.data.result;
        let arr = [];

        // Fee to be charged on each deposit by client's choice
        let fee = await Currency.findOne({short_name: short_name});
        console.log(fee.deposit_fee, ": deposit feeeeeeeeeeeeee");
        let dep_fee = fee.deposit_fee;

        let trans = await WalletTransaction.find({$and: [{user_id: userId},{transaction_type: 'DEPOSIT'}]})
        arr = trans.map(e => e.transaction_hash)

        // AMOUNT 
        let amount = result[i].value / 10 ** decimals;
        let total_amount = amount - dep_fee

        if(result.length > 0) {
            for (let i = 0; i < result.length; i++) {
                if ((result[i].to).toLowerCase() == address.toLowerCase() && !arr.includes(result[i].hash)) {
                    let txObj = {};
                    txObj.user_id = userId;
                    txObj.currency = currency
                    txObj.currency_id = currency_id
                    txObj.chain = chain
                    txObj.fee = dep_fee
                    txObj.short_name = short_name
                    txObj.amount = total_amount
                    txObj.transaction_type = 'DEPOSIT';
                    txObj.transaction_hash = result[i].hash
                    txObj.status = 'PENDING',
                    txObj.from_address = result[i].from
                    txObj.to_address = result[i].to

                    // First we have to deposit the amount into user wallet
                    let balance = await Wallets.updateOne(
                        {$and: [{user_id: userId},{currency_id: currency_id}]},
                        {
                            $inc: {
                                balance: txObj.amount
                            }
                        },
                        {upsert: true}
                    )

                    if(balance.upsertedCount > 0 || balance.modifiedCount > 0) {
                        // Second we have to create the transaction for this new transaction
                        await WalletTransaction.create(txObj)
                    }

                }
                
            }
        }
        return true
    } catch(error) {
        throw new Error(error)
    }
}

// Deposit Confirmation for any ARBISCAN Token on ARBISCAN chain
const verify_arbiscan_token_deposit = async (userId, currency, currency_id, chain, short_name, contract_address, address, decimals) => {
    try {
        let url = `https://api.arbiscan.io/api?module=account&action=tokentx&contractaddress=${contract_address}&address=${address}&page=1&offset=10000&startblock=0&endblock=27025780&sort=asc&apikey=${ARBISCAN_API}`
        let data = await axios.post(url);
        let result = data.data.result;
        let arr = [];

        // Fee to be charged on each deposit by client's choice
        let fee = await Currency.findOne({short_name: short_name});
        console.log(fee.deposit_fee, ": deposit feeeeeeeeeeeeee");
        let dep_fee = fee.deposit_fee;

        let trans = await WalletTransaction.find({$and: [{user_id: userId},{transaction_type: 'DEPOSIT'}]})
        arr = trans.map(e => e.transaction_hash)

        // AMOUNT 
        let amount = result[i].value / 10 ** decimals;
        let total_amount = amount - dep_fee

        if(result.length > 0) {
            for (let i = 0; i < result.length; i++) {
                if ((result[i].to).toLowerCase() == address.toLowerCase() && !arr.includes(result[i].hash)) {
                    let txObj = {};
                    txObj.user_id = userId;
                    txObj.currency = currency
                    txObj.currency_id = currency_id
                    txObj.chain = chain
                    txObj.fee = dep_fee
                    txObj.short_name = short_name
                    txObj.amount = total_amount
                    txObj.transaction_type = 'DEPOSIT';
                    txObj.transaction_hash = result[i].hash
                    txObj.status = 'PENDING',
                    txObj.from_address = result[i].from
                    txObj.to_address = result[i].to

                    // First we have to deposit the amount into user wallet
                    let balance = await Wallets.updateOne(
                        {$and: [{user_id: userId},{currency_id: currency_id}]},
                        {
                            $inc: {
                                balance: txObj.amount
                            }
                        },
                        {upsert: true}
                    )

                    if(balance.upsertedCount > 0 || balance.modifiedCount > 0) {
                        // Second we have to create the transaction for this new transaction
                        await WalletTransaction.create(txObj)
                    }

                }
                
            }
        }
        return true
    } catch(error) {
        throw new Error(error)
    }
}

module.exports = {
    verify_bnb_deposit,
    verify_bep20_token_deposit,
    verify_btc_deposit,
    verify_trc20_token_deposit,
    verify_erc20_token_deposit,
    verify_polygon_token_deposit,
    verify_arbiscan_token_deposit
};
