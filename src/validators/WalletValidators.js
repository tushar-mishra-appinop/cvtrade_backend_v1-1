const joi = require('joi');

const verifyWithdrawals = async(req, res, next) => {
    try {
        const verifyWithdrawalSchema = joi.object({
            user_id: joi.string().alphanum().required().messages({"any.user_id": "user_id is required"}),
            order_id: joi.string().required().messages({"any.order_id": "order_id is required"}),
            currency: joi.string().required().messages({"any.currency": "currency is required"}),
            status: joi.string().valid("COMPLETE", "CANCELLED").required()
            .messages({
                "string.valid": "Please enter valid status!",
                "any.required": "Please enter valid status!",
            }),
            transfered_amount: joi.number().min(0.00000001).required().messages({"any.amount": "amount is required"}),
        })

        const data = req.body;
        await verifyWithdrawalSchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const withdrawalValidation = async (req, res, next) => {
    try {
        const withdrawalSchema = joi.object({
            coinName: joi.string().required().messages({'any.coinName': 'Currency Name is required'}),
            withdrawal_address: joi.string().required().messages({'any.withdrawal_address': "Withdrawal Address is required"}),
            chain: joi.string().required().messages({'any.chain': "chain is required"}),
            amount: joi.number().required().messages({'any.amount': 'Amount is required'})
        })
        const data = req.body;
        await withdrawalSchema.validateAsync(data, {allowUnknown: true, errors: { wrap: { label: '' }}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const inrWithdrawValidation = async (req, res, next) => {
    try {
        const inrWithdrawSchema = joi.object({
            amount: joi.number().required().messages({'any.amount': 'Amount is required'}),
            user_bank: joi.required().messages({'any.bank_id': 'Please Select Bank From Drop down'})
        })
        const data = req.body;
        await inrWithdrawSchema.validateAsync(data, {allowUnknown: false, errors: { wrap: { label: '' }}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

module.exports = {
   verifyWithdrawals,
   withdrawalValidation,
   inrWithdrawValidation
}