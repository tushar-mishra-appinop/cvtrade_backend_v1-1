const joi = require("joi");

const placeOrderValidation = async (req, res, next) => {
    try {
        const coinSchema = joi.object({
            order_type: joi
                .string()
                .valid("SPOT", "MARKET", "LIMIT", "STOP LIMIT")
                .messages({
                    "string.valid": "Please enter valid order type!",
                    "any.required": "Please enter valid order type!",
                }),
            base_currency_id: joi
                .string()
                .required()
                .messages({
                    "any.base_currency_id": "base currency id is required",
                }),
            quote_currency_id: joi
                .string()
                .required()
                .messages({
                    "any.quote_currency_id": "quote currency id is required",
                }),
            side: joi.string().valid("BUY", "SELL").messages({
                "string.valid": "Please enter valid side!",
                "any.required": "Please enter valid side!",
            }),
            price: joi.number().messages({"any.price": "price is required"}),
            quantity: joi.number().messages({"any.quantity": "quantity is required"})
        });

        const data = req.body;
        await coinSchema.validateAsync(data, {
            allowUnknown: true,
            errors: { wrap: { label: "" } },
        });
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: [],
        });
    }
    next();
};

const historicalChartValidation = async(req, res, next) => {
    try {
        const tickerSchema = joi.object({
            base_currency: joi.string().required().messages({"base_currency.string": "base_currency is required"}),
            quote_currency: joi.string().required().messages({"quote_currency.string": "quote_currency is required"}),
        })
        const data = req.body;
        await tickerSchema.validateAsync(data, {
            allowUnknown: true,
            errors: { wrap: { label: "" } },
        });
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: [],
        });
    }
    next()
}

module.exports = {
    placeOrderValidation,
    historicalChartValidation
};
