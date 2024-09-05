const {
    mark_order,
    admin_commission,
    create_trade_transaction,
    calculate_maker_fee,
    calculate_taker_fee,
    both_currency_sell_orders_engine,
    both_currency_buy_orders_engine,
    update_locked_balance,
    update_balance,
    create_wallet_transaction
} = require("../controllers/EngineController");
const Orderbook = require("../models/Orderbook");

const engine = async(single_order) => {
    try {
        var isLocked = false;
        if(single_order.side === 'BUY') {
            // Sell means Supply (Find the lowest supply value)
            let sell_order = await both_currency_sell_orders_engine(single_order.base_currency_id, single_order.quote_currency_id);
            // console.log(sell_order,"hereis my new");
            for await (const orders of sell_order) {
                // console.log(orders,"order_sell");
                if(single_order.price >= orders.price) {
                    if(isLocked === false && (single_order.remaining > 0 && orders.remaining > 0) && (single_order.remaining === orders.remaining)) {
                        if(single_order.remaining <= 0 || orders.remaining <= 0) {
                            break
                        } 
                        isLocked = true; 
                        // First Condition - If order quantity is equal

                        // Step 1. we have to mark both buy and sell order as FILLED
                        let mark_buy = await mark_order(single_order._id, orders.remaining, -orders.remaining, 'FILLED');
                        let mark_sell = await mark_order(orders._id, single_order.remaining, -single_order.remaining, 'FILLED');
                        
                        // Step 2. We Have to calculate the admin commission
                        let buyer_amount;
                        let seller_amount;
                        if(single_order.order_type == 'MARKET') {
                            buyer_amount = await calculate_taker_fee(orders.price, orders.remaining, single_order.taker_fee)
                        } else {
                            buyer_amount = await calculate_maker_fee(orders.price, orders.remaining, single_order.maker_fee)
                        }

                        

                        // Step 2. We have to transfer admin commission to admin account
                        let admin = await admin_commission(single_order.user_id,buyer_amount.amount, buyer_amount.fee, buyer_amount.type, single_order.taker_fee, orders.base_currency_id, buyer_amount.admin_quantity);

                        // Step 3. we have to transfer crypto currency to the buyers account

                        // Create transaction into buyers account
                        let buyer_trans = {};
                        buyer_trans.order_id = single_order._id
                        buyer_trans.user_id = single_order.user_id;
                        buyer_trans.currency = single_order.ask_currency;
                        buyer_trans.base_currency_id = single_order.base_currency_id;
                        buyer_trans.quote_currency_id = single_order.quote_currency_id;
                        buyer_trans.quantity = orders.remaining;
                        buyer_trans.side = single_order.side;
                        buyer_trans.order_type = single_order.order_type;
                        buyer_trans.price = single_order.price;
                        buyer_trans.fee = buyer_amount.fee;
                        let transfer = await create_trade_transaction(buyer_trans)

                        // Step 4. we have to transfer amount to sellers account and reduce its locked balance including fee
                        let seller_total = buyer_amount.amount
                        let seller_lock_bal = await update_locked_balance(orders.user_id, orders.base_currency_id, -orders.remaining);
                        let seller_bal = await update_balance(orders.user_id, orders.quote_currency_id, seller_total)

                        // Step 5. - Create a Transaction for seller
                        let seller_transaction = {};
                        seller_transaction.order_id = orders._id
                        seller_transaction.user_id = orders.user_id
                        seller_transaction.currency = single_order.ask_currency,
                        seller_transaction.currency_id = single_order.base_currency_id
                        seller_transaction.quantity = orders.remaining
                        seller_transaction.price = orders.price
                        seller_transaction.amount = orders.remaining
                        seller_transaction.side = orders.side;
                        seller_transaction.transaction_type = 'CREDIT';
                        seller_transaction.order_type = orders.order_type;
                        seller_transaction.fee = buyer_amount.fee
                        seller_transaction.fee_type = 'taker_fee'
                        seller_transaction.tds = 0
                        let create_seller = await create_wallet_transaction(seller_transaction);


                        // Step 6. we have to transfer amount to buyers account and reduce its locked balance
                        let buyer_quantity = buyer_amount.amount + buyer_amount.fee;
                        let buyer_lock_bal = await update_locked_balance(single_order.user_id, single_order.quote_currency_id, -buyer_quantity);
                        let buyer_bal = await update_balance(single_order.user_id, single_order.base_currency_id, orders.remaining)

                        // Step 7. create a transaction for buyer
                        let buyer_transaction = {};
                        buyer_transaction.order_id = orders.order_id;
                        buyer_transaction.user_id = single_order.user_id;
                        buyer_transaction.currency = orders.ask_currency
                        buyer_transaction.currency_id = orders.quote_currency_id
                        buyer_transaction.quantity = orders.remaining
                        buyer_transaction.price = orders.price
                        buyer_transaction.amount = buyer_quantity
                        buyer_transaction.side = single_order.side
                        buyer_transaction.transaction_type = 'DEBIT'
                        buyer_transaction.order_type = single_order.order_type
                        buyer_transaction.fee = 0
                        buyer_transaction.fee_type = 'no_fee'
                        buyer_transaction.tds = 0
                        let create_buyer = await create_wallet_transaction(buyer_transaction);
                        single_order = await Orderbook.findOne({_id: single_order._id})
                        if(single_order != null && single_order.status === 'FILLED') {
                            isLocked = false;
                            continue
                        }
                        isLocked = false;
                        continue;
                    } else if(isLocked === false && (single_order.remaining > 0 && orders.remaining > 0) && (single_order.remaining > orders.remaining)) {
                        if(single_order.remaining <= 0 || orders.remaining <= 0) {
                            break
                        } 
                        isLocked = true; 
                        // Second Condition - If buy order quantity is greater then sell order quantity

                        // Step 1. we have to mark both buy order as partially executed and sell order as FILLED
                        let mark_buy = await mark_order(single_order._id, orders.remaining, -orders.remaining, 'PARTIALLY EXECUTED');
                        let mark_sell = await mark_order(orders._id, orders.remaining, -orders.remaining, 'FILLED');

                        // Step 2. We Have to calculate the admin commission
                        let buyer_amount;
                        let seller_amount;
                        if(single_order.order_type === 'MARKET') {
                            buyer_amount = await calculate_taker_fee(orders.price, orders.remaining, single_order.taker_fee)
                        } else {
                            buyer_amount = await calculate_maker_fee(orders.price, orders.remaining, single_order.maker_fee)
                        }
                         
                        // Step 3. We have to transfer admin commission to admin account
                        let admin = await admin_commission(single_order.user_id,buyer_amount.amount, buyer_amount.fee, buyer_amount.type, single_order.taker_fee, orders.base_currency_id,  buyer_amount.admin_quantity);

                        // Step 4. we have to transfer crypto currency to the buyers account

                        // Create transaction into buyers account
                        let buyer_trans = {};
                        buyer_trans.order_id = single_order._id;
                        buyer_trans.user_id = single_order.user_id;
                        buyer_trans.currency = single_order.ask_currency;
                        buyer_trans.base_currency_id = single_order.base_currency_id;
                        buyer_trans.quote_currency_id = single_order.quote_currency_id;
                        buyer_trans.quantity = orders.remaining;
                        buyer_trans.side = single_order.side;
                        buyer_trans.order_type = single_order.order_type;
                        buyer_trans.price = single_order.price;
                        buyer_trans.fee = buyer_amount.fee;
                        let transfer = await create_trade_transaction(buyer_trans)

                        // Step 5. we have to transfer amount to sellers account and reduce its locked balance including fee
                        let seller_total = buyer_amount.amount
                        let seller_lock_bal = await update_locked_balance(orders.user_id, orders.base_currency_id, -orders.remaining);
                        let seller_bal = await update_balance(orders.user_id, orders.quote_currency_id, seller_total)

                        // Step 6. - Create a Transaction for seller
                        let seller_transaction = {};
                        seller_transaction.order_id = orders._id
                        seller_transaction.user_id = orders.user_id
                        seller_transaction.currency = single_order.ask_currency,
                        seller_transaction.currency_id = single_order.base_currency_id
                        seller_transaction.quantity = orders.remaining
                        seller_transaction.price = orders.price
                        seller_transaction.amount = orders.remaining
                        seller_transaction.side = orders.side;
                        seller_transaction.transaction_type = 'CREDIT';
                        seller_transaction.order_type = orders.order_type;
                        seller_transaction.fee = buyer_amount.fee
                        seller_transaction.fee_type = 'taker_fee'
                        seller_transaction.tds = 0
                        let create_seller = await create_wallet_transaction(seller_transaction);

                        // Step 7. we have to transfer amount to buyers account and reduce its locked balance
                        let buyer_quantity = buyer_amount.amount + buyer_amount.fee;
                        let buyer_lock_bal = await update_locked_balance(single_order.user_id, single_order.quote_currency_id, -buyer_quantity);
                        let buyer_bal = await update_balance(single_order.user_id, single_order.base_currency_id, orders.remaining)

                        // Step 8. create a transaction for buyer
                        let buyer_transaction = {};
                        buyer_transaction.order_id = single_order._id;
                        buyer_transaction.user_id = single_order.user_id;
                        buyer_transaction.currency = orders.ask_currency
                        buyer_transaction.currency_id = orders.quote_currency_id
                        buyer_transaction.quantity = orders.remaining
                        buyer_transaction.price = orders.price
                        buyer_transaction.amount = buyer_quantity
                        buyer_transaction.side = single_order.side
                        buyer_transaction.transaction_type = 'DEBIT'
                        buyer_transaction.order_type = single_order.order_type
                        buyer_transaction.fee = 0
                        buyer_transaction.fee_type = 'no_fee'
                        buyer_transaction.tds = 0
                        let create_buyer = await create_wallet_transaction(buyer_transaction);
                        single_order = await Orderbook.findOne({_id: single_order._id})
                        if(single_order != null && single_order.status === 'FILLED') {
                            isLocked = false;
                            continue
                        }
                        isLocked = false;
                        continue;
                    } else if(isLocked === false && (single_order.remaining > 0 && orders.remaining > 0) && (single_order.remaining < orders.remaining)) {
                        if(single_order.remaining <= 0 || orders.remaining <= 0) {
                            break
                        } 
                        isLocked = true; 
                        // Second Condition - If buy order quantity is less then sell order quantity

                        // Step 1. we have to mark both buy order as FILLED and sell order as Partially Executed
                        let mark_buy = await mark_order(single_order._id, single_order.remaining, -single_order.remaining, 'FILLED');
                        let mark_sell = await mark_order(orders._id, single_order.remaining, -single_order.remaining, 'PARTIALLY EXECUTED');

                        // Step 2. We Have to calculate the admin commission
                        let buyer_amount;
                        let seller_amount;
                        if(single_order.order_type == 'MARKET') {
                            buyer_amount = await calculate_taker_fee(orders.price, single_order.remaining, single_order.taker_fee)
                        } else {
                            buyer_amount = await calculate_maker_fee(orders.price, single_order.remaining, single_order.maker_fee)
                        }

                        // Step 3. We have to transfer admin commission to admin account
                        let admin = await admin_commission(single_order.user_id,buyer_amount.amount, buyer_amount.fee, buyer_amount.type, single_order.taker_fee, orders.base_currency_id, buyer_amount.admin_quantity);

                        // Step 4. we have to transfer crypto currency to the buyers account

                        // Create transaction into buyers account
                        let buyer_trans = {};
                        buyer_trans.order_id = single_order._id;
                        buyer_trans.user_id = single_order.user_id;
                        buyer_trans.currency = single_order.ask_currency;
                        buyer_trans.base_currency_id = single_order.base_currency_id;
                        buyer_trans.quote_currency_id = single_order.quote_currency_id;
                        buyer_trans.quantity = single_order.remaining;
                        buyer_trans.side = single_order.side;
                        buyer_trans.order_type = single_order.order_type;
                        buyer_trans.price = single_order.price;
                        buyer_trans.fee = buyer_amount.fee;
                        let transfer = await create_trade_transaction(buyer_trans)

                        // Step 5. we have to transfer amount to sellers account and reduce its locked balance including fee
                        let seller_total = buyer_amount.amount
                        let seller_lock_bal = await update_locked_balance(orders.user_id, orders.base_currency_id, -single_order.remaining);
                        let seller_bal = await update_balance(orders.user_id, orders.quote_currency_id, seller_total)

                        // Step 6. - Create a Transaction for seller
                        let seller_transaction = {};
                        seller_transaction.order_id = orders._id
                        seller_transaction.user_id = orders.user_id
                        seller_transaction.currency = single_order.ask_currency,
                        seller_transaction.currency_id = single_order.base_currency_id
                        seller_transaction.quantity = single_order.remaining
                        seller_transaction.price = orders.price
                        seller_transaction.amount = single_order.remaining
                        seller_transaction.side = orders.side;
                        seller_transaction.transaction_type = 'CREDIT';
                        seller_transaction.order_type = orders.order_type;
                        seller_transaction.fee = buyer_amount.fee
                        seller_transaction.fee_type = 'taker_fee'
                        seller_transaction.tds = 0
                        let create_seller = await create_wallet_transaction(seller_transaction);

                        // Step 7. we have to transfer amount to buyers account and reduce its locked balance
                        let buyer_quantity = buyer_amount.amount + buyer_amount.fee;
                        let buyer_lock_bal = await update_locked_balance(single_order.user_id, single_order.quote_currency_id, -buyer_quantity);
                        let buyer_bal = await update_balance(single_order.user_id, single_order.base_currency_id, single_order.remaining)

                        // Step 8. create a transaction for buyer
                        let buyer_transaction = {};
                        buyer_transaction.user_id = single_order.user_id;
                        buyer_transaction.order_id = orders._id;
                        buyer_transaction.currency = orders.ask_currency
                        buyer_transaction.currency_id = orders.quote_currency_id
                        buyer_transaction.quantity = single_order.remaining
                        buyer_transaction.price = orders.price
                        buyer_transaction.amount = buyer_quantity
                        buyer_transaction.side = single_order.side
                        buyer_transaction.transaction_type = 'DEBIT'
                        buyer_transaction.order_type = single_order.order_type
                        buyer_transaction.fee = 0
                        buyer_transaction.fee_type = 'no_fee'
                        buyer_transaction.tds = 0
                        let create_buyer = await create_wallet_transaction(buyer_transaction);
                        single_order = await Orderbook.findOne({_id: single_order._id})
                        if(single_order != null && single_order.status === 'FILLED') {
                            isLocked = false;
                            continue
                        }
                        isLocked = false;
                        continue;
                    } else {
                        continue
                    }
                } else {
                    continue
                }
            }
            return true;
        } else {
            // Buy Means Demand Find The Highest Price
            let buy_order = await both_currency_buy_orders_engine(single_order.base_currency_id, single_order.quote_currency_id);
            for await (const orders of buy_order) {
                if(single_order.price <= orders.price) {
                    if(isLocked === false && (single_order.remaining > 0 && orders.remaining > 0) && (single_order.remaining === orders.remaining)) {
                        if(single_order.remaining <= 0 || orders.remaining <= 0) {
                            break
                        } 
                        isLocked = true; 
                        // Condition first when order quantity is equal
    
                        // Step 1. we have to mark both buy and sell order as FILLED
                        let mark_buy = await mark_order(orders._id, single_order.remaining, -single_order.remaining, 'FILLED');
                        let mark_sell = await mark_order(single_order._id, orders.remaining, -orders.remaining, 'FILLED');
    
                        // Step 2. We Have to calculate the admin commission
                        // In a sell order matching with a buy order where the sell order price is higher than the buy order
                        // price, the seller is considered the "maker" and the buyer is considered the "taker". Therefore, the
                        // maker fee is paid by the seller and the taker fee is paid by the buyer.
                        let buyer_amount;
                        let seller_amount;
                        if(single_order.order_type == 'MARKET') {
                            seller_amount = await calculate_maker_fee(single_order.price, single_order.remaining, orders.maker_fee)
                        } else {
                            seller_amount = await calculate_taker_fee(single_order.price, single_order.remaining, orders.taker_fee)
                        }
                        
                        // Step 2. We have to transfer admin commission to admin account
                        let admin = await admin_commission(single_order.user_id,seller_amount.amount, seller_amount.fee, seller_amount.type, single_order.maker_fee, orders.base_currency_id, seller_amount.admin_quantity);
    
                        // Step 3. we have to transfer crypto currency to the buyers account
    
                        // Create a trade transaction
                        let trade_transaction = {};
                        trade_transaction.user_id = single_order.user_id;
                        trade_transaction.order_id = single_order._id;
                        trade_transaction.currency = single_order.ask_currency;
                        trade_transaction.base_currency_id = single_order.base_currency_id;
                        trade_transaction.quote_currency_id = single_order.quote_currency_id;
                        trade_transaction.quantity = orders.remaining;
                        trade_transaction.side = single_order.side;
                        trade_transaction.order_type = single_order.order_type;
                        trade_transaction.price = single_order.price;
                        trade_transaction.fee = seller_amount.fee;
                        let transfer = await create_trade_transaction(trade_transaction)
    
                        // Step 4. we have to transfer amount to sellers account and reduce its locked balance including fee
                        let seller_total = seller_amount.amount
                        let seller_lock_bal = await update_locked_balance(single_order.user_id, single_order.base_currency_id, -single_order.remaining);
                        let seller_bal = await update_balance(single_order.user_id, single_order.quote_currency_id, seller_total)
    
                        // Step 5. - Create a Transaction for seller
                        let seller_transaction = {};
                        seller_transaction.user_id = single_order.user_id
                        seller_transaction.order_id = single_order._id
                        seller_transaction.currency = single_order.ask_currency,
                        seller_transaction.currency_id = single_order.base_currency_id
                        seller_transaction.quantity = single_order.remaining
                        seller_transaction.price = single_order.price
                        seller_transaction.amount = single_order.remaining
                        seller_transaction.side = single_order.side;
                        seller_transaction.transaction_type = 'CREDIT';
                        seller_transaction.order_type = single_order.order_type;
                        seller_transaction.fee = seller_amount.fee
                        seller_transaction.fee_type = 'maker_fee'
                        seller_transaction.tds = 0
                        let create_seller = await create_wallet_transaction(seller_transaction);
    
                         // Step 6. we have to transfer amount to buyers account and reduce its locked balance
                         let buyer_quantity = seller_amount.amount + seller_amount.fee;
                         let buyer_lock_bal = await update_locked_balance(orders.user_id, orders.quote_currency_id, -buyer_quantity);
                         let buyer_bal = await update_balance(orders.user_id, orders.base_currency_id, single_order.remaining)
    
                        // Step 7. create a transaction for buyer
                        let buyer_transaction = {};
                        buyer_transaction.user_id = orders.user_id;
                        buyer_transaction.order_id = orders._id;
                        buyer_transaction.currency = orders.ask_currency
                        buyer_transaction.currency_id = orders.quote_currency_id
                        buyer_transaction.quantity = orders.remaining
                        buyer_transaction.price = orders.price
                        buyer_transaction.amount = buyer_quantity
                        buyer_transaction.side = orders.side
                        buyer_transaction.transaction_type = 'DEBIT'
                        buyer_transaction.order_type = orders.order_type
                        buyer_transaction.fee = 0
                        buyer_transaction.fee_type = 'no_fee'
                        buyer_transaction.tds = 0
                        let create_buyer = await create_wallet_transaction(buyer_transaction);
                        single_order = await Orderbook.findOne({_id: single_order._id})
                        if(single_order != null && single_order.status === 'FILLED') {
                            isLocked = false;
                            continue
                        }
                        isLocked = false;
                        continue;
                    } else if(isLocked === false && (single_order.remaining > 0 && orders.remaining > 0) && (single_order.remaining > orders.remaining)) {
                        if(single_order.remaining <= 0 || orders.remaining <= 0) {
                            break
                        } 
                        isLocked = true; 
                        // When the Sell order quantity is Greater then buy order quantity
    
                        // Step 1. we have to mark both buy order as FILLED and sell order as PARTIALLY EXECUTED
                        let mark_buy = await mark_order(orders._id, orders.remaining, -orders.remaining, 'FILLED');
                        let mark_sell = await mark_order(single_order._id, orders.remaining, -orders.remaining, 'PARTIALLY EXECUTED');
    
                        // Step 2. We Have to calculate the admin commission
                        // In the condition where a sell order is matched with a buy order and the buy order has a lower price
                        // than the sell order, the sell order is considered the maker order and the buy order is considered
                        // the taker order. Therefore, the maker fee would be paid by the seller and the taker fee would be
                        // paid by the buyer.
    
                        let buyer_amount;
                        let seller_amount;
                        if(single_order.order_type == 'MARKET') {
                            seller_amount = await calculate_maker_fee(single_order.price, orders.remaining, orders.maker_fee)
                        } else {
                            seller_amount = await calculate_taker_fee(single_order.price, orders.remaining, orders.taker_fee)
                        }
    
                        // Step 2. We have to transfer admin commission to admin account
                        let admin = await admin_commission(single_order.user_id,seller_amount.amount, seller_amount.fee, seller_amount.type, single_order.maker_fee, orders.base_currency_id, seller_amount.admin_quantity);
    
                        // Step 3. we have to transfer crypto currency to the buyers account
    
                        // Create trade transaction
                        let trade_transaction = {};
                        trade_transaction.user_id = single_order.user_id;
                        trade_transaction.order_id = single_order._id;
                        trade_transaction.currency = single_order.ask_currency;
                        trade_transaction.base_currency_id = single_order.base_currency_id;
                        trade_transaction.quote_currency_id = single_order.quote_currency_id;
                        trade_transaction.quantity = orders.remaining;
                        trade_transaction.side = single_order.side;
                        trade_transaction.order_type = single_order.order_type;
                        trade_transaction.price = single_order.price;
                        trade_transaction.fee = seller_amount.fee;
                        let transfer = await create_trade_transaction(trade_transaction)
    
                        // Step 4. we have to transfer amount to sellers account and reduce its locked balance including fee
                        let seller_total = seller_amount.amount
                        let seller_lock_bal = await update_locked_balance(single_order.user_id, single_order.base_currency_id, -orders.remaining);
                        let seller_bal = await update_balance(single_order.user_id, single_order.quote_currency_id, seller_total)
    
                        // Step 5. - Create a Transaction for seller
                        let seller_transaction = {};
                        seller_transaction.user_id = single_order.user_id
                        seller_transaction.order_id = single_order._id
                        seller_transaction.currency = single_order.ask_currency,
                        seller_transaction.currency_id = single_order.base_currency_id
                        seller_transaction.quantity = orders.remaining
                        seller_transaction.price = single_order.price
                        seller_transaction.amount = orders.remaining
                        seller_transaction.side = single_order.side;
                        seller_transaction.transaction_type = 'CREDIT';
                        seller_transaction.order_type = single_order.order_type;
                        seller_transaction.fee = seller_amount.fee
                        seller_transaction.fee_type = 'maker_fee'
                        seller_transaction.tds = 0
                        let create_seller = await create_wallet_transaction(seller_transaction);
    
                        // Step 6. we have to transfer amount to buyers account and reduce its locked balance
                        let buyer_quantity = seller_amount.amount + seller_amount.fee;
                        let buyer_lock_bal = await update_locked_balance(orders.user_id, orders.quote_currency_id, -buyer_quantity);
                        let buyer_bal = await update_balance(orders.user_id, orders.base_currency_id, orders.remaining)
    
                        // Step 7. create a transaction for buyer
                        let buyer_transaction = {};
                        buyer_transaction.user_id = orders.user_id;
                        buyer_transaction.order_id = orders._id;
                        buyer_transaction.currency = orders.ask_currency
                        buyer_transaction.currency_id = orders.quote_currency_id
                        buyer_transaction.quantity = orders.remaining
                        buyer_transaction.price = orders.price
                        buyer_transaction.amount = buyer_quantity
                        buyer_transaction.side = orders.side
                        buyer_transaction.transaction_type = 'DEBIT'
                        buyer_transaction.order_type = orders.order_type
                        buyer_transaction.fee = 0
                        buyer_transaction.fee_type = 'no_fee'
                        buyer_transaction.tds = 0
                        let create_buyer = await create_wallet_transaction(buyer_transaction);
                        single_order = await Orderbook.findOne({_id: single_order._id})
                        if(single_order != null && single_order.status === 'FILLED') {
                            isLocked = false;
                            continue
                        }
                        isLocked = false;
                        continue;
                    } else if(isLocked === false && (single_order.remaining > 0 && orders.remaining > 0) && (single_order.remaining < orders.remaining)) {
                        if(single_order.remaining <= 0 || orders.remaining <= 0) {
                            break
                        } 
                        isLocked = true; 
                        // When the Sell order quantity is Less then buy order quantity
    
                        // Step 1. we have to mark both buy order as FILLED and sell order as PARTIALLY EXECUTED
                        let mark_buy = await mark_order(orders._id, single_order.remaining, -single_order.remaining, 'PARTIALLY EXECUTED');
                        let mark_sell = await mark_order(single_order._id, single_order.remaining, -single_order.remaining, 'FILLED');
    
                        // Step 2. We Have to calculate the admin commission
                        // If the sell quantity is less than the buy quantity, the order will be partially filled.
                        // The sell order will be matched with the highest buy order(s) until the sell order is
                        // completely filled or there are no more buy orders left to match.
    
                        let buyer_amount;
                        let seller_amount;
                        if(single_order.order_type == 'MARKET') {
                            seller_amount = await calculate_maker_fee(single_order.price, single_order.remaining, orders.maker_fee)
                        } else {
                            seller_amount = await calculate_taker_fee(single_order.price, single_order.remaining, orders.taker_fee)
                        }
    
                        // Step 2. We have to transfer admin commission to admin account
                        let admin = await admin_commission(single_order.user_id,seller_amount.amount, seller_amount.fee, seller_amount.type, single_order.maker_fee, orders.base_currency_id, seller_amount.admin_quantity);
    
                        // Step 3. we have to transfer crypto currency to the buyers account
    
                        // Create transaction into buyers account
                        let trade_transaction = {};
                        trade_transaction.user_id = single_order.user_id;
                        trade_transaction.order_id = single_order._id;
                        trade_transaction.currency = single_order.ask_currency;
                        trade_transaction.base_currency_id = single_order.base_currency_id;
                        trade_transaction.quote_currency_id = single_order.quote_currency_id;
                        trade_transaction.quantity = single_order.remaining;
                        trade_transaction.side = single_order.side;
                        trade_transaction.order_type = single_order.order_type;
                        trade_transaction.price = single_order.price;
                        trade_transaction.fee = seller_amount.fee;
                        let transfer = await create_trade_transaction(trade_transaction);
    
                        // Step 4. we have to transfer amount to sellers account and reduce its locked balance including fee
                        let seller_total = seller_amount.amount
                        let seller_lock_bal = await update_locked_balance(single_order.user_id, single_order.base_currency_id, -single_order.remaining);
                        let seller_bal = await update_balance(single_order.user_id, single_order.quote_currency_id, seller_total)
    
                        // Step 5. - Create a Transaction for seller
                        let seller_transaction = {};
                        seller_transaction.user_id = single_order.user_id
                        seller_transaction.order_id = single_order._id
                        seller_transaction.currency = single_order.ask_currency,
                        seller_transaction.currency_id = single_order.base_currency_id
                        seller_transaction.quantity = orders.remaining
                        seller_transaction.price = single_order.price
                        seller_transaction.amount = single_order.remaining
                        seller_transaction.side = single_order.side;
                        seller_transaction.transaction_type = 'CREDIT';
                        seller_transaction.order_type = single_order.order_type;
                        seller_transaction.fee = seller_amount.fee
                        seller_transaction.fee_type = 'maker_fee'
                        seller_transaction.tds = 0
                        let create_seller = await create_wallet_transaction(seller_transaction);
    
                        // Step 6. we have to transfer amount to buyers account and reduce its locked balance
                        let buyer_quantity = seller_amount.amount + seller_amount.fee;
                        let buyer_lock_bal = await update_locked_balance(orders.user_id, orders.quote_currency_id, -buyer_quantity);
                        let buyer_bal = await update_balance(orders.user_id, orders.base_currency_id, single_order.remaining)
    
                        // Step 7. create a transaction for buyer
                        let buyer_transaction = {};
                        buyer_transaction.user_id = orders.user_id;
                        buyer_transaction.order_id = orders._id;
                        buyer_transaction.currency = orders.ask_currency
                        buyer_transaction.currency_id = orders.quote_currency_id
                        buyer_transaction.quantity = single_order.remaining
                        buyer_transaction.price = orders.price
                        buyer_transaction.amount = buyer_quantity
                        buyer_transaction.side = orders.side
                        buyer_transaction.transaction_type = 'DEBIT'
                        buyer_transaction.order_type = orders.order_type
                        buyer_transaction.fee = 0
                        buyer_transaction.fee_type = 'no_fee'
                        buyer_transaction.tds = 0
                        let create_buyer = await create_wallet_transaction(buyer_transaction);
                        single_order = await Orderbook.findOne({_id: single_order._id})
                        if(single_order != null && single_order.status === 'FILLED') {
                            isLocked = false;
                            continue
                        }
                        isLocked = false;
                        continue;
                    } else {
                        continue
                    }
                } else {
                    continue
                }
            }
            return true;
        }
    } catch (error) {
        console.log(error.message, " Error occured");
    }
}

module.exports = engine;
