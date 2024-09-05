const Orderbook = require("../models/Orderbook");
const {
    mark_order,
    admin_commission,
    create_trade_transaction,
    pending_orders_lifo,
    calculate_maker_fee,
    calculate_taker_fee,
    both_currency_sell_orders,
    both_currency_buy_orders,
    update_locked_balance,
    update_balance,
    create_wallet_transaction,
    user_details
} = require("../controllers").EngineController;
const { email_marketing, mobile_marketing } = require('../utils/Marketing');

// This engine will follow First In, First Out (FIFO) algorithm
const engine = async () => {
   try {
        // Find All Orders
        let orders = await pending_orders_lifo();

        for (let i = 0; i < orders.length; i++) {
            
            if(orders[i].side == 'BUY') {
                // Sell means Supply (Find the lowest supply value)
                let sell_order = await both_currency_sell_orders(orders[i].base_currency_id, orders[i].quote_currency_id);
                // BUY Orders
                for (let j = 0; j < sell_order.length; j++) {
                    
                    // User cannot match its own orders
                    if(orders[i].user_id != sell_order[j].user_id) {
                        if(orders[i].price >= sell_order[j].price) {
                            if(orders[i].remaining === sell_order[j].remaining) {
                                // First Condition - If order quantity is equal

                                // Step 1. we have to mark both buy and sell order as FILLED
                                let mark_buy = await mark_order(orders[i]._id, sell_order[j].remaining, -sell_order[j].remaining, 'FILLED');
                                let mark_sell = await mark_order(sell_order[j]._id, orders[i].remaining, -orders[i].remaining, 'FILLED');
                                
                                // Step 2. We Have to calculate the admin commission
                                let buyer_amount;
                                let seller_amount;
                                if(orders[i].order_type == 'MARKET') {
                                    buyer_amount = await calculate_taker_fee(sell_order[j].price, sell_order[j].remaining, orders[i].taker_fee)
                                } 

                                // Step 2. We have to transfer admin commission to admin account
                                let admin = await admin_commission(orders[i].user_id,buyer_amount.amount, buyer_amount.fee, buyer_amount.type, orders[i].taker_fee, sell_order[j].base_currency_id, buyer_amount.admin_quantity);

                                // Step 3. we have to transfer crypto currency to the buyers account

                                // Create transaction into buyers account
                                let buyer_trans = {};
                                buyer_trans.order_id = orders[i]._id
                                buyer_trans.user_id = orders[i].user_id;
                                buyer_trans.currency = orders[i].ask_currency;
                                buyer_trans.base_currency_id = orders[i].base_currency_id;
                                buyer_trans.quote_currency_id = orders[i].base_currency_id;
                                buyer_trans.quantity = sell_order[j].remaining;
                                buyer_trans.side = orders[i].side;
                                buyer_trans.order_type = orders[i].order_type;
                                buyer_trans.price = orders[i].price;
                                buyer_trans.fee = orders[i].maker_fee;
                                let transfer = await create_trade_transaction(buyer_trans)

                                // Step 4. we have to transfer amount to sellers account and reduce its locked balance including fee
                                let seller_total = buyer_amount.amount - buyer_amount.fee
                                let seller_lock_bal = await update_locked_balance(sell_order[j].user_id, sell_order[j].base_currency_id, -sell_order[j].remaining);
                                let seller_bal = await update_balance(sell_order[j].user_id, sell_order[j].quote_currency_id, seller_total)

                                // Step 5. - Create a Transaction for seller
                                let seller_transaction = {};
                                seller_transaction.order_id = sell_order[j]._id
                                seller_transaction.user_id = sell_order[j].user_id
                                seller_transaction.currency = orders[i].ask_currency,
                                seller_transaction.currency_id = orders[i].base_currency_id
                                seller_transaction.quantity = sell_order[j].remaining
                                seller_transaction.price = sell_order[j].price
                                seller_transaction.amount = sell_order[j].remaining
                                seller_transaction.side = sell_order[j].side;
                                seller_transaction.transaction_type = 'CREDIT';
                                seller_transaction.order_type = sell_order[j].order_type;
                                seller_transaction.fee = buyer_amount.fee
                                seller_transaction.fee_type = 'taker_fee'
                                seller_transaction.tds = 0
                                let create_seller = await create_wallet_transaction(seller_transaction);


                                // Step 6. we have to transfer amount to buyers account and reduce its locked balance
                                let buyer_quantity = buyer_amount.amount;
                                let buyer_lock_bal = await update_locked_balance(orders[i].user_id, orders[i].quote_currency_id, -buyer_quantity);
                                let buyer_bal = await update_balance(orders[i].user_id, orders[i].base_currency_id, sell_order[j].remaining)

                                // Step 7. create a transaction for buyer
                                let buyer_transaction = {};
                                buyer_transaction.order_id = sell_order[j].order_id;
                                buyer_transaction.user_id = sell_order[j].user_id;
                                buyer_transaction.currency = sell_order[j].ask_currency
                                buyer_transaction.currency_id = sell_order[j].quote_currency_id
                                buyer_transaction.quantity = sell_order[j].remaining
                                buyer_transaction.price = sell_order[j].price
                                buyer_transaction.amount = buyer_quantity
                                buyer_transaction.side = orders[i].side
                                buyer_transaction.transaction_type = 'DEBIT'
                                buyer_transaction.order_type = orders[j].order_type
                                buyer_transaction.fee = 0
                                buyer_transaction.fee_type = 'no_fee'
                                buyer_transaction.tds = 0
                                let create_buyer = await create_wallet_transaction(buyer_transaction);

                                // Step 8 - we have to notify the buyer and seller
                                let buyer_detail = await user_details(orders[i].user_id);
                                let seller_details = await user_details(sell_order[j].user_id);
                                // if(buyer_detail) {
                                //     if(buyer_detail.email) {
                                //         let msg = `${buyer_transaction.quantity} ${buyer_transaction.currency}`
                                //         await email_marketing('exchange', 'Order Confirm', msg, buyer_detail.email);
                                //     } else {
                                //         let msg = `${buyer_transaction.quantity} ${buyer_transaction.currency}`
                                //         let number = buyer_detail.country_code + buyer_detail.phone
                                //         await mobile_marketing('exchange', msg, number);
                                //     }
                                // }

                                //  if(seller_details) {
                                //     if(seller_details.email) {
                                //         let msg = `${seller_transaction.quantity} ${seller_transaction.currency}`
                                //         await email_marketing('exchange', 'Order Confirm', msg, seller_details.email);
                                //     } else {
                                //         let msg = `${seller_transaction.quantity} ${seller_transaction.currency}`
                                //         let number = seller_details.country_code + seller_details.phone
                                //         await mobile_marketing('exchange', msg, number);
                                //     }
                                // }    
                                break;
                            } else if(orders[i].remaining > sell_order[j].remaining) {
                                // Second Condition - If buy order quantity is greater then sell order quantity

                                // Step 1. we have to mark both buy order as partially executed and sell order as FILLED
                                let mark_buy = await mark_order(orders[i]._id, sell_order[j].remaining, -sell_order[j].remaining, 'PARTIALLY EXECUTED');
                                let mark_sell = await mark_order(sell_order[j]._id, sell_order[j].remaining, -sell_order[j].remaining, 'FILLED');

                                // Step 2. We Have to calculate the admin commission
                                let buyer_amount;
                                let seller_amount;
                                if(orders[i].order_type == 'MARKET') {
                                    buyer_amount = await calculate_taker_fee(sell_order[j].price, sell_order[j].remaining, orders[i].taker_fee)
                                }
                                 
                                // Step 3. We have to transfer admin commission to admin account
                                let admin = await admin_commission(orders[i].user_id,buyer_amount.amount, buyer_amount.fee, buyer_amount.type, orders[i].taker_fee, sell_order[j].base_currency_id,  buyer_amount.admin_quantity);

                                // Step 4. we have to transfer crypto currency to the buyers account

                                // Create transaction into buyers account
                                let buyer_trans = {};
                                buyer_trans.order_id = orders[i]._id;
                                buyer_trans.user_id = orders[i].user_id;
                                buyer_trans.currency = orders[i].ask_currency;
                                buyer_trans.base_currency_id = orders[i].base_currency_id;
                                buyer_trans.quote_currency_id = orders[i].base_currency_id;
                                buyer_trans.quantity = sell_order[j].remaining;
                                buyer_trans.side = orders[i].side;
                                buyer_trans.order_type = orders[i].order_type;
                                buyer_trans.price = orders[i].price;
                                buyer_trans.fee = orders[i].maker_fee;
                                let transfer = await create_trade_transaction(buyer_trans)

                                // Step 5. we have to transfer amount to sellers account and reduce its locked balance including fee
                                let seller_total = buyer_amount.amount - buyer_amount.fee
                                let seller_lock_bal = await update_locked_balance(sell_order[j].user_id, sell_order[j].base_currency_id, -sell_order[j].remaining);
                                let seller_bal = await update_balance(sell_order[j].user_id, sell_order[j].quote_currency_id, seller_total)

                                 // Step 6. - Create a Transaction for seller
                                 let seller_transaction = {};
                                 seller_transaction.order_id = sell_order[j]._id
                                 seller_transaction.user_id = sell_order[j].user_id
                                 seller_transaction.currency = orders[i].ask_currency,
                                 seller_transaction.currency_id = orders[i].base_currency_id
                                 seller_transaction.quantity = sell_order[j].remaining
                                 seller_transaction.price = sell_order[j].price
                                 seller_transaction.amount = sell_order[j].remaining
                                 seller_transaction.side = sell_order[j].side;
                                 seller_transaction.transaction_type = 'CREDIT';
                                 seller_transaction.order_type = sell_order[j].order_type;
                                 seller_transaction.fee = buyer_amount.fee
                                 seller_transaction.fee_type = 'taker_fee'
                                 seller_transaction.tds = 0
                                 let create_seller = await create_wallet_transaction(seller_transaction);

                                // Step 7. we have to transfer amount to buyers account and reduce its locked balance
                                let buyer_quantity = buyer_amount.amount;
                                let buyer_lock_bal = await update_locked_balance(orders[i].user_id, orders[i].quote_currency_id, -buyer_quantity);
                                let buyer_bal = await update_balance(orders[i].user_id, orders[i].base_currency_id, sell_order[j].remaining)

                                // Step 8. create a transaction for buyer
                                let buyer_transaction = {};
                                buyer_transaction.order_id = orders[i]._id;
                                buyer_transaction.user_id = sell_order[j].user_id;
                                buyer_transaction.currency = sell_order[j].ask_currency
                                buyer_transaction.currency_id = sell_order[j].quote_currency_id
                                buyer_transaction.quantity = sell_order[j].remaining
                                buyer_transaction.price = sell_order[j].price
                                buyer_transaction.amount = buyer_quantity
                                buyer_transaction.side = orders[i].side
                                buyer_transaction.transaction_type = 'DEBIT'
                                buyer_transaction.order_type = orders[j].order_type
                                buyer_transaction.fee = 0
                                buyer_transaction.fee_type = 'no_fee'
                                buyer_transaction.tds = 0
                                let create_buyer = await create_wallet_transaction(buyer_transaction);

                                // Step 9 - we have to notify the buyer and seller
                                let buyer_detail = await user_details(orders[i].user_id);
                                let seller_details = await user_details(sell_order[j].user_id);
                                // if(buyer_detail) {
                                //     if(buyer_detail.email) {
                                //         let msg = `${buyer_transaction.quantity} ${buyer_transaction.currency}`
                                //         await email_marketing('exchange', 'Order Confirm', msg, buyer_detail.email);
                                //     } else {
                                //         let msg = `${buyer_transaction.quantity} ${buyer_transaction.currency}`
                                //         let number = buyer_detail.country_code + buyer_detail.phone
                                //         await mobile_marketing('exchange', msg, number);
                                //     }
                                // }

                                //  if(seller_details) {
                                //     if(seller_details.email) {
                                //         let msg = `${seller_transaction.quantity} ${seller_transaction.currency}`
                                //         await email_marketing('exchange', 'Order Confirm', msg, seller_details.email);
                                //     } else {
                                //         let msg = `${seller_transaction.quantity} ${seller_transaction.currency}`
                                //         let number = seller_details.country_code + seller_details.phone
                                //         await mobile_marketing('exchange', msg, number);
                                //     }
                                // }  
                                break;
                            } else if(orders[i].remaining < sell_order[j].remaining) {
                                // Second Condition - If buy order quantity is less then sell order quantity

                                // Step 1. we have to mark both buy order as FILLED and sell order as Partially Executed
                                let mark_buy = await mark_order(orders[i]._id, orders[i].remaining, -orders[i].remaining, 'FILLED');
                                let mark_sell = await mark_order(sell_order[j]._id, orders[i].remaining, -orders[i].remaining, 'PARTIALLY EXECUTED');

                                // Step 2. We Have to calculate the admin commission
                                let buyer_amount;
                                let seller_amount;
                                if(orders[i].order_type == 'MARKET') {
                                    buyer_amount = await calculate_taker_fee(sell_order[j].price, orders[i].remaining, orders[i].taker_fee)
                                }

                                // Step 3. We have to transfer admin commission to admin account
                                let admin = await admin_commission(orders[i].user_id,buyer_amount.amount, buyer_amount.fee, buyer_amount.type, orders[i].taker_fee, sell_order[j].base_currency_id, buyer_amount.admin_quantity);

                                // Step 4. we have to transfer crypto currency to the buyers account

                                // Create transaction into buyers account
                                let buyer_trans = {};
                                buyer_trans.order_id = orders[i]._id;
                                buyer_trans.user_id = orders[i].user_id;
                                buyer_trans.currency = orders[i].ask_currency;
                                buyer_trans.base_currency_id = orders[i].base_currency_id;
                                buyer_trans.quote_currency_id = orders[i].base_currency_id;
                                buyer_trans.quantity = orders[i].remaining;
                                buyer_trans.side = orders[i].side;
                                buyer_trans.order_type = orders[i].order_type;
                                buyer_trans.price = orders[i].price;
                                buyer_trans.fee = orders[i].maker_fee;
                                let transfer = await create_trade_transaction(buyer_trans)

                                // Step 5. we have to transfer amount to sellers account and reduce its locked balance including fee
                                let seller_total = buyer_amount.amount - buyer_amount.fee
                                let seller_lock_bal = await update_locked_balance(sell_order[j].user_id, sell_order[j].base_currency_id, -orders[i].remaining);
                                let seller_bal = await update_balance(sell_order[j].user_id, sell_order[j].quote_currency_id, seller_total)

                                // Step 6. - Create a Transaction for seller
                                let seller_transaction = {};
                                seller_transaction.order_id = sell_order[j]._id
                                seller_transaction.user_id = sell_order[j].user_id
                                seller_transaction.currency = orders[i].ask_currency,
                                seller_transaction.currency_id = orders[i].base_currency_id
                                seller_transaction.quantity = orders[i].remaining
                                seller_transaction.price = sell_order[j].price
                                seller_transaction.amount = orders[i].remaining
                                seller_transaction.side = sell_order[j].side;
                                seller_transaction.transaction_type = 'CREDIT';
                                seller_transaction.order_type = sell_order[j].order_type;
                                seller_transaction.fee = buyer_amount.fee
                                seller_transaction.fee_type = 'taker_fee'
                                seller_transaction.tds = 0
                                let create_seller = await create_wallet_transaction(seller_transaction);

                                // Step 7. we have to transfer amount to buyers account and reduce its locked balance
                                let buyer_quantity = buyer_amount.amount;
                                let buyer_lock_bal = await update_locked_balance(orders[i].user_id, orders[i].quote_currency_id, -buyer_quantity);
                                let buyer_bal = await update_balance(orders[i].user_id, orders[i].base_currency_id, orders[i].remaining)

                                 // Step 8. create a transaction for buyer
                                 let buyer_transaction = {};
                                 buyer_transaction.user_id = sell_order[j].user_id;
                                 buyer_transaction.order_id = sell_order[j]._id;
                                 buyer_transaction.currency = sell_order[j].ask_currency
                                 buyer_transaction.currency_id = sell_order[j].quote_currency_id
                                 buyer_transaction.quantity = orders[i].remaining
                                 buyer_transaction.price = sell_order[j].price
                                 buyer_transaction.amount = buyer_quantity
                                 buyer_transaction.side = orders[i].side
                                 buyer_transaction.transaction_type = 'DEBIT'
                                 buyer_transaction.order_type = orders[j].order_type
                                 buyer_transaction.fee = 0
                                 buyer_transaction.fee_type = 'no_fee'
                                 buyer_transaction.tds = 0
                                 let create_buyer = await create_wallet_transaction(buyer_transaction);

                                // Step 9 - we have to notify the buyer and seller
                                let buyer_detail = await user_details(orders[i].user_id);
                                let seller_details = await user_details(sell_order[j].user_id);
                                // if(buyer_detail) {
                                //     if(buyer_detail.email) {
                                //         let msg = `${buyer_transaction.quantity} ${buyer_transaction.currency}`
                                //         await email_marketing('exchange', 'Order Confirm', msg, buyer_detail.email);
                                //     } else {
                                //         let msg = `${buyer_transaction.quantity} ${buyer_transaction.currency}`
                                //         let number = buyer_detail.country_code + buyer_detail.phone
                                //         await mobile_marketing('exchange', msg, number);
                                //     }
                                // }

                                //  if(seller_details) {
                                //     if(seller_details.email) {
                                //         let msg = `${seller_transaction.quantity} ${seller_transaction.currency}`
                                //         await email_marketing('exchange', 'Order Confirm', msg, seller_details.email);
                                //     } else {
                                //         let msg = `${seller_transaction.quantity} ${seller_transaction.currency}`
                                //         let number = seller_details.country_code + seller_details.phone
                                //         await mobile_marketing('exchange', msg, number);
                                //     }
                                // }  
                                break;
                            }
                        }
                    }
                }
            } else {
                // SELL Orders
                // Buy Means Demand Find The Highest Price
                 let buy_order = await both_currency_buy_orders(orders[i].base_currency_id, orders[i].quote_currency_id);

                for (let j = 0; j < buy_order.length; j++) {
                    // User cannot match its own orders
                    if(orders[i].user_id != buy_order[j].user_id){
                        // Sell order price will be less then or equal to the buy order price
                        if(orders[i].price <= buy_order[j].price) {
                            // When the Sell order quantity is equal to buy order quantity
                            if(orders[i].remaining === buy_order[j].remaining) {
                                // Condition first when order quantity is equal

                                // Step 1. we have to mark both buy and sell order as FILLED
                                let mark_buy = await mark_order(buy_order[j]._id, orders[i].remaining, -orders[i].remaining, 'FILLED');
                                let mark_sell = await mark_order(orders[i]._id, buy_order[j].remaining, -buy_order[j].remaining, 'FILLED');

                                // Step 2. We Have to calculate the admin commission
                                // In a sell order matching with a buy order where the sell order price is higher than the buy order
                                // price, the seller is considered the "maker" and the buyer is considered the "taker". Therefore, the
                                // maker fee is paid by the seller and the taker fee is paid by the buyer.
                                let buyer_amount;
                                let seller_amount;
                                if(orders[i].order_type == 'MARKET') {
                                    seller_amount = await calculate_maker_fee(orders[i].price, orders[i].remaining, buy_order[j].maker_fee)
                                }

                                // Step 2. We have to transfer admin commission to admin account
                                let admin = await admin_commission(orders[i].user_id,seller_amount.amount, seller_amount.fee, seller_amount.type, orders[i].maker_fee, buy_order[j].base_currency_id, seller_amount.admin_quantity);

                                // Step 3. we have to transfer crypto currency to the buyers account

                                // Create transaction into buyers account
                                let buyer_trans = {};
                                buyer_trans.user_id = buy_order[j].user_id;
                                buyer_trans.order_id = buy_order[j]._id;
                                buyer_trans.currency = buy_order[j].ask_currency;
                                buyer_trans.base_currency_id = buy_order[j].base_currency_id;
                                buyer_trans.quote_currency_id = buy_order[j].base_currency_id;
                                buyer_trans.quantity = orders[i].remaining;
                                buyer_trans.side = buy_order[j].side;
                                buyer_trans.order_type = buy_order[j].order_type;
                                buyer_trans.price = buy_order[j].price;
                                buyer_trans.fee = buy_order[j].maker_fee;
                                let transfer = await create_trade_transaction(buyer_trans)

                                // Step 4. we have to transfer amount to sellers account and reduce its locked balance including fee
                                let seller_total = seller_amount.amount - seller_amount.fee
                                let seller_lock_bal = await update_locked_balance(orders[i].user_id, orders[i].base_currency_id, -orders[i].remaining);
                                let seller_bal = await update_balance(orders[i].user_id, orders[i].quote_currency_id, orders[i].remaining)

                                // Step 5. - Create a Transaction for seller
                                let seller_transaction = {};
                                seller_transaction.user_id = orders[i].user_id
                                seller_transaction.order_id = orders[i]._id
                                seller_transaction.currency = orders[i].ask_currency,
                                seller_transaction.currency_id = orders[i].base_currency_id
                                seller_transaction.quantity = orders[i].remaining
                                seller_transaction.price = orders[i].price
                                seller_transaction.amount = orders[i].remaining
                                seller_transaction.side = orders[i].side;
                                seller_transaction.transaction_type = 'CREDIT';
                                seller_transaction.order_type = orders[i].order_type;
                                seller_transaction.fee = seller_amount.fee
                                seller_transaction.fee_type = 'maker_fee'
                                seller_transaction.tds = 0
                                let create_seller = await create_wallet_transaction(seller_transaction);

                                 // Step 6. we have to transfer amount to buyers account and reduce its locked balance
                                 let buyer_quantity = seller_amount.amount + seller_amount.fee;
                                 let buyer_lock_bal = await update_locked_balance(buy_order[j].user_id, buy_order[j].quote_currency_id, -buyer_quantity);
                                 let buyer_bal = await update_balance(buy_order[j].user_id, buy_order[j].base_currency_id, orders[i].remaining)

                                // Step 7. create a transaction for buyer
                                let buyer_transaction = {};
                                buyer_transaction.user_id = buy_order[j].user_id;
                                buyer_transaction.order_id = buy_order[j]._id;
                                buyer_transaction.currency = buy_order[j].ask_currency
                                buyer_transaction.currency_id = buy_order[j].quote_currency_id
                                buyer_transaction.quantity = buy_order[j].remaining
                                buyer_transaction.price = buy_order[j].price
                                buyer_transaction.amount = buyer_quantity
                                buyer_transaction.side = buy_order[j].side
                                buyer_transaction.transaction_type = 'DEBIT'
                                buyer_transaction.order_type = buy_order[j].order_type
                                buyer_transaction.fee = 0
                                buyer_transaction.fee_type = 'no_fee'
                                buyer_transaction.tds = 0
                                let create_buyer = await create_wallet_transaction(buyer_transaction);

                                // Step 8 - we have to notify the buyer and seller
                                let buyer_detail = await user_details(buy_order[j].user_id);
                                let seller_details = await user_details(orders[i].user_id);
                                // if(buyer_detail) {
                                //     if(buyer_detail.email) {
                                //         let msg = `${buyer_transaction.quantity} ${buyer_transaction.currency}`
                                //         await email_marketing('exchange', 'Order Confirm', msg, buyer_detail.email);
                                //     } else {
                                //         let msg = `${buyer_transaction.quantity} ${buyer_transaction.currency}`
                                //         let number = buyer_detail.country_code + buyer_detail.phone
                                //         await mobile_marketing('exchange', msg, number);
                                //     }
                                // }

                                //  if(seller_details) {
                                //     if(seller_details.email) {
                                //         let msg = `${seller_transaction.quantity} ${seller_transaction.currency}`
                                //         await email_marketing('exchange', 'Order Confirm', msg, seller_details.email);
                                //     } else {
                                //         let msg = `${seller_transaction.quantity} ${seller_transaction.currency}`
                                //         let number = seller_details.country_code + seller_details.phone
                                //         await mobile_marketing('exchange', msg, number);
                                //     }
                                // }    
                                break;
                            } else if(orders[i].remaining > buy_order[j].remaining) {
                                // When the Sell order quantity is Greater then buy order quantity

                                // Step 1. we have to mark both buy order as FILLED and sell order as PARTIALLY EXECUTED
                                let mark_buy = await mark_order(buy_order[j]._id, buy_order[j].remaining, -buy_order[j].remaining, 'FILLED');
                                let mark_sell = await mark_order(orders[i]._id, buy_order[j].remaining, -buy_order[j].remaining, 'PARTIALLY EXECUTED');

                                // Step 2. We Have to calculate the admin commission
                                // In the condition where a sell order is matched with a buy order and the buy order has a lower price
                                // than the sell order, the sell order is considered the maker order and the buy order is considered
                                // the taker order. Therefore, the maker fee would be paid by the seller and the taker fee would be
                                // paid by the buyer.

                                let buyer_amount;
                                let seller_amount;
                                if(orders[i].order_type == 'MARKET') {
                                    seller_amount = await calculate_maker_fee(orders[i].price, buy_order[j].remaining, buy_order[j].maker_fee)
                                }

                                // Step 2. We have to transfer admin commission to admin account
                                let admin = await admin_commission(orders[i].user_id,seller_amount.amount, seller_amount.fee, seller_amount.type, orders[i].maker_fee, buy_order[j].base_currency_id, seller_amount.admin_quantity);

                                // Step 3. we have to transfer crypto currency to the buyers account

                                // Create transaction into buyers account
                                let buyer_trans = {};
                                buyer_trans.user_id = buy_order[j].user_id;
                                buyer_trans.order_id = buy_order[j]._id;
                                buyer_trans.currency = buy_order[j].ask_currency;
                                buyer_trans.base_currency_id = buy_order[j].base_currency_id;
                                buyer_trans.quote_currency_id = buy_order[j].base_currency_id;
                                buyer_trans.quantity = buy_order[j].remaining;
                                buyer_trans.side = buy_order[j].side;
                                buyer_trans.order_type = buy_order[j].order_type;
                                buyer_trans.price = buy_order[j].price;
                                buyer_trans.fee = buy_order[j].maker_fee;
                                let transfer = await create_trade_transaction(buyer_trans)

                                // Step 4. we have to transfer amount to sellers account and reduce its locked balance including fee
                                let seller_total = seller_amount.amount - seller_amount.fee
                                let seller_lock_bal = await update_locked_balance(orders[i].user_id, orders[i].base_currency_id, -buy_order[j].remaining);
                                let seller_bal = await update_balance(orders[i].user_id, orders[i].quote_currency_id, seller_total)

                                // Step 5. - Create a Transaction for seller
                                let seller_transaction = {};
                                seller_transaction.user_id = orders[i].user_id
                                seller_transaction.order_id = orders[i]._id
                                seller_transaction.currency = orders[i].ask_currency,
                                seller_transaction.currency_id = orders[i].base_currency_id
                                seller_transaction.quantity = buy_order[j].remaining
                                seller_transaction.price = orders[i].price
                                seller_transaction.amount = buy_order[j].remaining
                                seller_transaction.side = orders[i].side;
                                seller_transaction.transaction_type = 'CREDIT';
                                seller_transaction.order_type = orders[i].order_type;
                                seller_transaction.fee = seller_amount.fee
                                seller_transaction.fee_type = 'maker_fee'
                                seller_transaction.tds = 0
                                let create_seller = await create_wallet_transaction(seller_transaction);

                                // Step 6. we have to transfer amount to buyers account and reduce its locked balance
                                let buyer_quantity = seller_amount.amount + seller_amount.fee;
                                let buyer_lock_bal = await update_locked_balance(buy_order[j].user_id, buy_order[j].quote_currency_id, -buyer_quantity);
                                let buyer_bal = await update_balance(buy_order[j].user_id, buy_order[j].base_currency_id, buy_order[j].remaining)

                                // Step 7. create a transaction for buyer
                                let buyer_transaction = {};
                                buyer_transaction.user_id = buy_order[j].user_id;
                                buyer_transaction.order_id = buy_order[j]._id;
                                buyer_transaction.currency = buy_order[j].ask_currency
                                buyer_transaction.currency_id = buy_order[j].quote_currency_id
                                buyer_transaction.quantity = buy_order[j].remaining
                                buyer_transaction.price = buy_order[j].price
                                buyer_transaction.amount = buyer_quantity
                                buyer_transaction.side = buy_order[j].side
                                buyer_transaction.transaction_type = 'DEBIT'
                                buyer_transaction.order_type = buy_order[j].order_type
                                buyer_transaction.fee = 0
                                buyer_transaction.fee_type = 'no_fee'
                                buyer_transaction.tds = 0
                                let create_buyer = await create_wallet_transaction(buyer_transaction);

                                // Step 8 - we have to notify the buyer and seller
                                let buyer_detail = await user_details(buy_order[j].user_id);
                                let seller_details = await user_details(orders[i].user_id);
                                // if(buyer_detail) {
                                //     if(buyer_detail.email) {
                                //         let msg = `${buyer_transaction.quantity} ${buyer_transaction.currency}`
                                //         await email_marketing('exchange', 'Order Confirm', msg, buyer_detail.email);
                                //     } else {
                                //         let msg = `${buyer_transaction.quantity} ${buyer_transaction.currency}`
                                //         let number = buyer_detail.country_code + buyer_detail.phone
                                //         await mobile_marketing('exchange', msg, number);
                                //     }
                                // }

                                //  if(seller_details) {
                                //     if(seller_details.email) {
                                //         let msg = `${seller_transaction.quantity} ${seller_transaction.currency}`
                                //         await email_marketing('exchange', 'Order Confirm', msg, seller_details.email);
                                //     } else {
                                //         let msg = `${seller_transaction.quantity} ${seller_transaction.currency}`
                                //         let number = seller_details.country_code + seller_details.phone
                                //         await mobile_marketing('exchange', msg, number);
                                //     }
                                // }    
                                break;
                            } else if(orders[i].remaining < buy_order[j].remaining) {
                                // When the Sell order quantity is Less then buy order quantity

                                // Step 1. we have to mark both buy order as FILLED and sell order as PARTIALLY EXECUTED
                                let mark_buy = await mark_order(buy_order[j]._id, orders[i].remaining, -orders[i].remaining, 'PARTIALLY EXECUTED');
                                let mark_sell = await mark_order(orders[i]._id, orders[i].remaining, -orders[i].remaining, 'FILLED');

                                // Step 2. We Have to calculate the admin commission
                                // If the sell quantity is less than the buy quantity, the order will be partially filled.
                                // The sell order will be matched with the highest buy order(s) until the sell order is
                                // completely filled or there are no more buy orders left to match.

                                let buyer_amount;
                                let seller_amount;
                                if(orders[i].order_type == 'MARKET') {
                                    seller_amount = await calculate_maker_fee(orders[i].price, orders[i].remaining, buy_order[j].maker_fee)
                                }

                                // Step 2. We have to transfer admin commission to admin account
                                let admin = await admin_commission(orders[i].user_id,seller_amount.amount, seller_amount.fee, seller_amount.type, orders[i].maker_fee, buy_order[j].base_currency_id, seller_amount.admin_quantity);

                                // Step 3. we have to transfer crypto currency to the buyers account

                                // Create transaction into buyers account
                                let buyer_trans = {};
                                buyer_trans.user_id = buy_order[j].user_id;
                                buyer_trans.order_id = buy_order[j]._id;
                                buyer_trans.currency = buy_order[j].ask_currency;
                                buyer_trans.base_currency_id = buy_order[j].base_currency_id;
                                buyer_trans.quote_currency_id = buy_order[j].base_currency_id;
                                buyer_trans.quantity = orders[i].remaining;
                                buyer_trans.side = buy_order[j].side;
                                buyer_trans.order_type = buy_order[j].order_type;
                                buyer_trans.price = buy_order[j].price;
                                buyer_trans.fee = buy_order[j].maker_fee;
                                let transfer = await create_trade_transaction(buyer_trans);

                                // Step 4. we have to transfer amount to sellers account and reduce its locked balance including fee
                                let seller_total = seller_amount.amount - seller_amount.fee
                                let seller_lock_bal = await update_locked_balance(orders[i].user_id, orders[i].base_currency_id, -orders[i].remaining);
                                let seller_bal = await update_balance(orders[i].user_id, orders[i].quote_currency_id, seller_total)

                                // Step 5. - Create a Transaction for seller
                                let seller_transaction = {};
                                seller_transaction.user_id = orders[i].user_id
                                seller_transaction.order_id = orders[i]._id
                                seller_transaction.currency = orders[i].ask_currency,
                                seller_transaction.currency_id = orders[i].base_currency_id
                                seller_transaction.quantity = buy_order[j].remaining
                                seller_transaction.price = orders[i].price
                                seller_transaction.amount = orders[i].remaining
                                seller_transaction.side = orders[i].side;
                                seller_transaction.transaction_type = 'CREDIT';
                                seller_transaction.order_type = orders[i].order_type;
                                seller_transaction.fee = seller_amount.fee
                                seller_transaction.fee_type = 'maker_fee'
                                seller_transaction.tds = 0
                                let create_seller = await create_wallet_transaction(seller_transaction);

                                // Step 6. we have to transfer amount to buyers account and reduce its locked balance
                                let buyer_quantity = seller_amount.amount + seller_amount.fee;
                                let buyer_lock_bal = await update_locked_balance(buy_order[j].user_id, buy_order[j].quote_currency_id, -buyer_quantity);
                                let buyer_bal = await update_balance(buy_order[j].user_id, buy_order[j].base_currency_id, orders[i].remaining)

                                // Step 7. create a transaction for buyer
                                let buyer_transaction = {};
                                buyer_transaction.user_id = buy_order[j].user_id;
                                buyer_transaction.order_id = buy_order[j]._id;
                                buyer_transaction.currency = buy_order[j].ask_currency
                                buyer_transaction.currency_id = buy_order[j].quote_currency_id
                                buyer_transaction.quantity = orders[i].remaining
                                buyer_transaction.price = buy_order[j].price
                                buyer_transaction.amount = buyer_quantity
                                buyer_transaction.side = buy_order[j].side
                                buyer_transaction.transaction_type = 'DEBIT'
                                buyer_transaction.order_type = buy_order[j].order_type
                                buyer_transaction.fee = 0
                                buyer_transaction.fee_type = 'no_fee'
                                buyer_transaction.tds = 0
                                let create_buyer = await create_wallet_transaction(buyer_transaction);

                                // Step 8 - we have to notify the buyer and seller
                                let buyer_detail = await user_details(buy_order[j].user_id);
                                let seller_details = await user_details(orders[i].user_id);
                                // if(buyer_detail) {
                                //     if(buyer_detail.email) {
                                //         let msg = `${buyer_transaction.quantity} ${buyer_transaction.currency}`
                                //         await email_marketing('exchange', 'Order Confirm', msg, buyer_detail.email);
                                //     } else {
                                //         let msg = `${buyer_transaction.quantity} ${buyer_transaction.currency}`
                                //         let number = buyer_detail.country_code + buyer_detail.phone
                                //         await mobile_marketing('exchange', msg, number);
                                //     }
                                // }

                                //  if(seller_details) {
                                //     if(seller_details.email) {
                                //         let msg = `${seller_transaction.quantity} ${seller_transaction.currency}`
                                //         await email_marketing('exchange', 'Order Confirm', msg, seller_details.email);
                                //     } else {
                                //         let msg = `${seller_transaction.quantity} ${seller_transaction.currency}`
                                //         let number = seller_details.country_code + seller_details.phone
                                //         await mobile_marketing('exchange', msg, number);
                                //     }
                                // }    
                                break;
                            }
                        }
                    }
                }
            }
        }
   } catch (error) {
        console.log(error, " : we are facing some error in engine please check into engine code!!")
   }
};

module.exports = engine;
