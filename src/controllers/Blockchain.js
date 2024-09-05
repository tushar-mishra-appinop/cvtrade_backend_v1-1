const UserAddress = require('../models/UserAddresses')
const Admin = require('../models/Admin')
const { featchingBal } = require('../utils/TransferGas')
const { getHotWalletbalance,getHotWalletbalanceTRON } = require('../utils/CheckHotWalletBalance')
const { transferToken,tokenTransferTron } = require('../utils/TransferTokenToHot')
const { email_marketing } = require('../utils/Marketing.js')
const { clientCommandMessageReg } = require('bullmq')

module.exports = {
    transfer_funds: async() => {
        try {
            let master = await Admin.findOne({email_or_phone: 'admin@cvtrade.exchange'})
            
            // console.log(master,"master fund");
            let adminwallet = await UserAddress.findOne({$and: [{user_id: master._id}, {chain: 'BEP20'}]})
            let userwallet = await UserAddress.find({$and: [{user_id: {$ne: master._id}}, {chain: 'BEP20'}]})
            // console.log(userwallet, " : userwallet")
            // console.log(adminwallet, " : adminrwallet")

            if(adminwallet === null) {
                // await WalletController.admin_wallet(master._id);
                console.log('send email that admin has to generate the address first')
            } else {

        
                let balance = await getHotWalletbalance(adminwallet.address)
                console.log(balance, " : balance transfer_funds")

                if (balance < 0.001) {
                    console.log('send email to admin to manage 0.1 BNB in master wallet')
                } 
                if(userwallet.length > 0 && balance >= 0.001){
                    // Start transfering gas fees here
                    // console.log('in else if transfer_funds')
                    let gas = await featchingBal(adminwallet.address, adminwallet.private_key, userwallet)
                    // console.log(gas,"We are inside gas fee")
                    if(gas) {
                        let transfer_token = await transferToken(adminwallet.address, userwallet)
                        if(transfer_token) {
                            console.log('transfer completed without any error')
                            return true
                        } else {
                            return false
                        }
                    }
                } else {
                    console.log('transfer_funds else')
                }
            }
            console.log('Process completed send email to admin');
            return true;
        } catch (error) {
            throw new Error(error.message)
        }
    },




    transfer_fundsTRC20: async() =>{
        console.log("transfer_fundsTRC20")
        const MINIMUM_HOTWALLET_FUNDS_SHOULD_BE = 0; //50TRX for production 
        try {
            console.log("transfer_fundsTRC20")
            let master = await await Admin.findOne({email_or_phone: 'admin@cvtrade.exchange'})
            let adminwallet = await UserAddress.findOne({$and: [{user_id: master._id}, {chain: 'TRC20'}]})
            let userwallet = await UserAddress.find({$and: [{user_id: {$ne: master._id}}, {chain: 'TRC20'}]})
            // console.log(userwallet, " : userwallet")
            console.log(adminwallet, " : adminwallet")
            if(adminwallet === null) {
                console.log('send email that admin has to generate the address first')
            } else {
                console.log(adminwallet.address)
                let balance = await getHotWalletbalanceTRON(adminwallet.address)
              
                console.log(balance, " : balance transfer_funds line 113")
                if (balance < MINIMUM_HOTWALLET_FUNDS_SHOULD_BE) {
                    console.log('send email to admin to manage 10TRX in master wallet')
                    // await email_marketing( "blockchain", 'bnb_low_balance', master.email_or_phone)
                } 
                else{
                    console.log('in else if transfer_funds')
                                            
                        //energy
                        var currentAccountEnergy;
                        var EnergyLimit;
                        var EnergyUsed;                      
                        //bandwidth
                        var totalBandwidth;
                        var freeNetLimit; 
                        var NetLimit;
                        var totalBandwidthUsed 
                        var NetUsed;
                        var freeNetUsed;
                        var currentAccountBandwidth;
                        var totalBandwidth;
                        var totalBandwidthUsed ;
                    let transferFunction = await tokenTransferTron(adminwallet.address, adminwallet.private_key, userwallet)
                    if(transferFunction) {
                        console.log('transfer completed without any error')
                        return true
                    } else {
                        return false
                    }

                }


            }

            
            
        } catch (error) {
            console.log(`error in try catch ${error.message}`)
        }
    }


}
