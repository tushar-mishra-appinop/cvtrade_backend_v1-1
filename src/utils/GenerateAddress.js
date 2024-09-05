const axios = require("axios");
const crypto = require('crypto');
const Web3 = require("web3");
// Below url is for bep20 chain
const web3 = new Web3("https://divine-evocative-ensemble.bsc.quiknode.pro/b5141e57fa6d9728dad93e152930b0b629fed863");

// Below url is for ETH chain mainnet
const ethereum = new Web3("https://eth-mainnet.g.alchemy.com/v2/-RRZtOpj_mnvjqcrtXvU8f2nfH7R7cdT");

// Below url is for matic
const matic = new Web3("https://polygon-rpc.com");
const TronWeb = require('tronweb');
const CoinKey = require("coinkey");
 
const btcWallet = new CoinKey.createRandom();
const { ADDRESS_KEY, BNB_ADDRESS_URL, BTC_ADDRESS_URL, RIK_ADDRESS_URL } = process.env;

generateBep20 = async () => {
    try {
        const walletAddress = await web3.eth.accounts.create();
        console.log(walletAddress, ": wallet Addressssssss");
        return walletAddress;
    } catch (error) {
        throw new Error(error.message);
    }
};

generatePolygonAddress = async () => {
    try {
        const walletAddress = await matic.eth.accounts.create();
        console.log(walletAddress);
        return walletAddress;
    } catch (error) {
        throw new Error(error.message);
    }
};

generateBtcAddr = async () => {
    try {
        console.log(
            "SAVE BUT DO NOT SHARE THIS:",
            btcWallet.privateKey.toString("hex")
        );
        console.log("Address:", btcWallet.publicAddress);
        let address = btcWallet.publicAddress;
        console.log(address, ": Hellooo")
        console.log(btcWallet, ": Btc wallet")
        console.log(btcWallet.publicAddress, ": Public Addresss" )
        let privateKey = btcWallet.privateKey.toString("hex");
        let obj = {
            address: address,
            private_key: privateKey,
        };
        return obj;
    } catch (error) {
        throw new Error(error.message);
    }
};

generateTrxAddress = async () => {
    try {
        let privateKey = crypto.randomBytes(32).toString('hex');
    

        const HttpProvider = TronWeb.providers.HttpProvider;
        const fullNode = new HttpProvider("https://api.trongrid.io");
        const solidityNode = new HttpProvider("https://api.trongrid.io");
        const eventServer = new HttpProvider("https://api.trongrid.io");
        const tronWeb = new TronWeb(fullNode,solidityNode,eventServer,privateKey);
        const wallet = await tronWeb.createAccount();
        // console.log(wallet,"check_wallet");
  console.log(wallet ,"tronwev");
        return wallet;
    } catch (error) {
        throw await apiResponse.err(error.message, 500)
    }

}

generateEthAddress = async() => {
    try {
        const walletAddress = await ethereum.eth.accounts.create();
        console.log(walletAddress);
        return walletAddress;
    } catch (error) {
        throw new Error(error.message);
    }
}

module.exports = {
    generateBep20,
    generateBtcAddr,
    generateTrxAddress,
    generatePolygonAddress,
    generateEthAddress
};
