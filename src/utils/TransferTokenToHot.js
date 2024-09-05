const Web3 = require("web3");
const TronWeb = require("tronweb");
const { commonAbi } = require("./Blockchain.json");
const WalletTransaction = require("../models/WalletTransaction");
const Currency = require("../models/Currency");
const { BNBRPC, RECEIVE_ADD } = process.env;

const web3 = new Web3(new Web3.providers.HttpProvider(BNBRPC));
const fullNode = "https://api.trongrid.io";
const solidityNode = "https://api.trongrid.io";
const eventServer = "https://api.trongrid.io";
const tronWeb = new TronWeb(fullNode, solidityNode, eventServer);

const transferToken = async (address_hotWallet, token) => {
  try {
    console.log("here...");
    for await (const single_token of token) {
      let datas = await Currency.find({
        $or: [
          { short_name: "CVT" },
          // { short_name: 'USDT' }
        ],
      });
      for await (const data of datas) {
        let tokenAddress = data.contract_address;
        const AccountAddress = single_token.address;
        const AccountPrivateKey = single_token.private_key;
        const recipientAddress = RECEIVE_ADD;
        const tokenAbi = commonAbi;
        if (JSON.parse(tokenAddress).BEP20 === "undefined") {
          console.log("heeeeeeeeee");
          continue;
        }
        const tokenContract = new web3.eth.Contract(
          tokenAbi,
          JSON.parse(tokenAddress).BEP20
        );
        let balance = await tokenContract.methods
          .balanceOf(AccountAddress)
          .call();
        balance = balance.toString();
        console.log("Sender Token Balance:", balance);
        if (balance > 0) {
          console.log(`User have balance =>`, balance);

          try {
            console.log("Transfering token to hotWallet");
            const amount = balance;
            const gasEstimate = await tokenContract.methods
              .transfer(recipientAddress, amount)
              .estimateGas({ from: AccountAddress });
            console.log("Estimated Gas: ", gasEstimate);

            const gasPrice = await web3.eth.getGasPrice();
            console.log("Gas Price: ", gasPrice);

            const senderEthBalance = await web3.eth.getBalance(AccountAddress);
            console.log(
              "Sender ETH/BNB Balance: ",
              web3.utils.fromWei(senderEthBalance, "ether")
            );

            const txCost = gasEstimate * gasPrice;
            if (BigInt(senderEthBalance) < BigInt(txCost)) {
              console.log(
                `Insufficient funds for gas. Required: ${web3.utils.fromWei(
                  txCost.toString(),
                  "ether"
                )} BNB`
              );
              continue;
            }

            const signedTx = await web3.eth.accounts.signTransaction(
              {
                to: tokenContract.options.address,
                data: tokenContract.methods
                  .transfer(recipientAddress, amount)
                  .encodeABI(),
                gas: gasEstimate,
                gasPrice: gasPrice,
                chainId: await web3.eth.getChainId(),
              },
              AccountPrivateKey
            );

            const receipt = await web3.eth.sendSignedTransaction(
              signedTx.rawTransaction
            );
            console.log("Transaction hash:", receipt.transactionHash);

            try {
              // saving tx receip
              // console.log(single_token._id,"testmyfund___******_____");
              console.log(single_token.currency_id, "checkis");
              const testmy = await Currency.findById({
                _id: single_token.currency_id,
              });
              console.log(testmy, "single_token._id");
              let obj = {};
              obj.user_id = single_token.user_id;
              obj.currency = testmy.short_name;
              obj.currency_id = single_token.currency_id;
              obj.chain = single_token.chain;
              obj.short_name = testmy.short_name;
              obj.description = "Member to Master Token Transfer";
              obj.transaction_type = "Transfer";
              obj.transaction_hash = tx.hash;
              obj.status = "complete";
              obj.from_address = tx.from;
              obj.to_address = tx.to;
              obj.fee = txCost
              obj.amount= balance;
              console.log(obj, "object testmy_object");
              let create_transaction = await WalletTransaction.create(obj);
              if (create_transaction) {
                return true;
              } else {
                return false;
              }
            } catch (err) {
              console.log("Error saving recipt", err.message);
            }
          } catch (err) {
            console.log("Error sending Tokens", err.message);
          }
        } else {
          console.log(
            `Insufficient Token balance to send transaction ${AccountAddress}`
          );
        }
      }
    }
  } catch (e) {
    console.log(`Error featching tokens`, e.message);
  }
};

const MINIMUM_TRX_BALANCE_USER_SHOULD_HAVE = 0;
const MINIMUM_BANDWITH_BALANCE_USER_SHOULD_HAVE = 400;
const SUN_RATE = 420;

const tokenTransferTron = async (
  address_hotWallet,
  PrivateKey_hotwallet,
  token
) => {
  try {
    for await (const single_token of token) {
      console.log("Token list", token);
      let datas = await Currency.find({});
      for await (const data of datas) {
        console.log(data, " : data");
        let tokenAddress = data.contract_address;
        console.log("tokenAddress ", JSON.parse(tokenAddress).TRC20);
        if (JSON.parse(tokenAddress).TRC20 === "undefined") {
          console.log("heeeeeeeeee");
          continue;
        }
        let TOKEN_ADD = JSON.parse(tokenAddress).TRC20;
        const AccountPrivateKey = single_token.private_key;
        console.log("Account private key", AccountPrivateKey);
        const userAddress = single_token.address;
        console.log("userAddress ", userAddress);
        const tronWebAccount = new TronWeb(
          fullNode,
          solidityNode,
          eventServer,
          AccountPrivateKey
        );
        const accountResource = await tronWebAccount.trx.getAccountResources(
          userAddress
        );

        freeNetLimit = accountResource.freeNetLimit;
        if (typeof freeNetLimit === `undefined`) {
          value = 0;
        }

        freeNetUsed = accountResource.freeNetUsed;
        if (typeof freeNetUsed === `undefined`) {
          freeNetUsed = 0;
        }

        NetLimit = accountResource.NetLimit;
        if (typeof NetLimit === `undefined`) {
          NetLimit = 0;
        }

        NetUsed = accountResource.NetUsed;
        if (typeof NetUsed === `undefined`) {
          NetUsed = 0;
        }

        totalBandwidth = freeNetLimit + NetLimit;

        totalBandwidthUsed = NetUsed + freeNetUsed;

        currentAccountBandwidth = totalBandwidth - totalBandwidthUsed;
        console.log("Current Account Bandwidth: " + currentAccountBandwidth);

        EnergyLimit = accountResource.EnergyLimit;
        if (typeof EnergyLimit === `undefined`) {
          EnergyLimit = 0;
        }

        EnergyUsed = accountResource.EnergyUsed;
        if (typeof EnergyUsed === `undefined`) {
          EnergyUsed = 0;
        }

        currentAccountEnergy = EnergyLimit - EnergyUsed;
        console.log("Current Account Energy: " + currentAccountEnergy);
        const userTRXBalance = await tronWeb.trx.getBalance(userAddress);
        console.log("User TRX Balance", userTRXBalance);
        if (
          MINIMUM_BANDWITH_BALANCE_USER_SHOULD_HAVE > 400 &&
          userTRXBalance > MINIMUM_TRX_BALANCE_USER_SHOULD_HAVE
        ) {
          console.log("inside current account bandwidth loop");
          console.log(`=============${userAddress}=============`);
          console.log(`inside trx balance loop ${userTRXBalance}`);
          console.log(`================================`);

          console.log("TOKEN_ADD", TOKEN_ADD);
          let contract = await tronWebAccount.contract().at(TOKEN_ADD);
          let result = await contract.balanceOf(userAddress).call();
          console.log("result", result);
          const tokenToTransfer = result.toString();
          console.log("tokenToTransfer: ", tokenToTransfer);
          const functionSelector = "transfer(address,uint256)";
          const parameter = [
            { type: "address", value: address_hotWallet },
            { type: "uint256", value: tokenToTransfer },
          ];
          try {
            if(tokenToTransfer > 1 ){
            const tokenAddHex = tronWeb.address.toHex(TOKEN_ADD)
            const gasEstiated  = await tronWebAccount.transactionBuilder.estimateEnergy(tokenAddHex, functionSelector, {}, parameter);
           const energy_required = gasEstiated.energy_required

           const requireTRXForTransaction = energy_required * SUN_RATE;
           console.log("requireTRXForTransaction",requireTRXForTransaction)

              try {
                const transaction = await tronWeb.transactionBuilder.sendTrx(
                  userAddress,
                  requireTRXForTransaction ,
                  address_hotWallet
                );
                const signedTransaction = await tronWeb.trx.sign(transaction, PrivateKey_hotwallet);
                const receipt = await tronWeb.trx.sendRawTransaction(signedTransaction);
                console.log('Transaction receipt of TRX from HotWallet to User :', receipt);
                    // save gas transaction recepit details here

                    let obj = {};
                    obj.user_id = single_token.user_id;
                    obj.currency = single_token.short_name;
                    obj.currency_id = single_token.currency_id;
                    obj.chain = single_token.chain;
                    obj.short_name = single_token.short_name;
                    obj.description = "Master to member gas  Transfer";
                    obj.transaction_type = "Transfer";
                    obj.transaction_hash = receipt.txID;
                    obj.status = receipt.result;
                  let create_transaction = await WalletTransaction.create(obj);

                  try{
                const tx = await tronWebAccount.transactionBuilder.triggerSmartContract(tokenAddHex, functionSelector, {}, parameter);
                const signedTx = await tronWebAccount.trx.sign(tx.transaction);
                const result = await tronWebAccount.trx.sendRawTransaction(signedTx);
                console.log("Token sent to HotWallet ", result);
                    // save token transaction recepit details here

                    let obj = {};
                    obj.user_id = single_token.user_id;
                    obj.currency = single_token.short_name;
                    obj.currency_id = single_token.currency_id;
                    obj.chain = single_token.chain;
                    obj.short_name = single_token.short_name;
                    obj.description = "Member to Master Transfer";
                    obj.transaction_type = "Transfer";
                    obj.transaction_hash = result.txID;
                    obj.status = result.result;
                    let create_transaction = await WalletTransaction.create(obj);
                    if (create_transaction) {
                      return true;
                    } else {
                      return false;
                    }
          }
          catch(e){
            console.log("Error sending trokn transition", e);
          }
              }
              catch (error) {
                  console.log("Error transfering funds requied for transfering tokens to hotwallet " + error.message)
              }
            }
          } catch (error) {
            console.log(`error.message: ${error.message}`)
          }
        }
      }
    }
  } catch (error) {
    console.log("Error in main try-cathc", error.message);
  }
};

module.exports = {
  transferToken,
  tokenTransferTron,
};
