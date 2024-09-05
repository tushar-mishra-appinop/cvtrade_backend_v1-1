const joi = require('joi');

const postValidation = async(req, res, next) => {
    try {
        const createPostSchema = joi.object({
            base_currency: joi.string().required().messages({"string.base_currency": "base_currency is required"}),
            quote_currency: joi.string().required().messages({"string.base_currency": "base_currency is required"}),
            price_type: joi.string().required().messages({"string.base_currency": "base_currency is required"}),
            side: joi.string().required().messages({"string.base_currency": "base_currency is required"}),
            payment_method: joi.array().required().messages({"string.base_currency": "base_currency is required"}),
            //remark: joi.string().required().messages({"string.base_currency": "base_currency is required"}),
            fixed_price: joi.number().required().messages({"any.fixed_price": "fixed_price is required"}),
           
            payment_time: joi.date().required().messages({"any.payment_time": "payment_time is required"}),
        })

        const data = req.body;
        await createPostSchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const orderDetailsValidations  = async(req, res, next) => {
    try {
        const createPostSchema = joi.object({
            order_id: joi.string().required().messages({"string.order_id": "order_id is required"}),
        })

        const data = req.body;
        await createPostSchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
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
    postValidation,
    orderDetailsValidations
}
