const Web3 = require("web3");
const TronWeb = require('tronweb');
const { BNBRPC } = process.env;
const web3 = new Web3(BNBRPC);

const fullNode = "https://api.trongrid.io" 
const solidityNode ="https://api.trongrid.io"
const eventServer = "https://api.trongrid.io"


const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);


const getHotWalletbalance = async (address_hotWallet) => {
    let balance = await web3.eth.getBalance(address_hotWallet)
    console.log(balance,"i am e");
    console.log(`Balance of ${address_hotWallet}: ${web3.utils.fromWei(balance,"ether")} BNB`)
    let bal = await web3.utils.fromWei(balance,"ether")
    return bal;
};
const getHotWalletbalanceTRON = async(address_hotWallet) =>{
    console.log("inside checking hotwallet balance")
    let address = address_hotWallet;
    console.log(address,"inside check hotwallet balance")
    const balance = await tronWeb.trx.getBalance(address)
    console.log("balance",balance)
    const bal = balance / 1e6;
    console.log("balance in TRX",bal)
    return bal;
    
}
module.exports = {
    getHotWalletbalance,
    getHotWalletbalanceTRON
};
