const joi = require('joi');
const addCoinValidation = async(req, res, next) => {
    try {
        const coinSchema = joi.object({
            name: joi.string().required().messages({"any.name": "name is required"}),
            short_name: joi.string().messages({"any.short_name": "short name is required"}),
            chain: joi.string().messages({"any.chain": "chain is required"}),
            decimals: joi.string().messages({"any.decimals": "decimals is required for all chains"})
        })

        const data = req.body;
        await coinSchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const addPairValidation = async(req, res, next) => {
    try {
        const coinSchema = joi.object({
            base_currency: joi.string().required().messages({"any.base_currency": "base_currency is required"}),
            base_currency_id: joi.string().alphanum().required().messages({"any.base_currency_id": "base_currency_id is required"}),
            quote_currency: joi.string().messages({"any.quote_currency": "quote_currency is required"}),
            quote_currency_id: joi.string().alphanum().required().messages({"any.quote_currency_id": "quote_currency_id is required"}),
            available: joi.string().valid("GLOBAL", "LOCAL").required().messages({"any.available": "available is required"}),
        })

        const data = req.body;
        await coinSchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
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
    addCoinValidation,
    addPairValidation
}