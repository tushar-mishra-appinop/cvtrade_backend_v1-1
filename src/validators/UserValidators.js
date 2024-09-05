const joi = require('joi');

const signupValidation = async(req, res, next) => {
    try {
        const signupSchema = joi.object({
            email_or_phone:  [
                joi.number().min(10 ** 9).max(10 ** 10 - 1).required().messages({
                  'number.min': 'Mobile number should be 10 digit.',
                  'number.max': 'Mobile number should be 10 digit'
                }),
                joi.string().email().required().messages({
                    'string.email': 'Please add a valid email.',
                }),
            ],
            password: joi.string()
                    .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$'))
                    .required()
                    .messages({
                        "string.pattern.base":
                          "New password Must have at least 8 characters and one Uppercase one lowercase and a special character and number",
                      }),
            confirm_password: joi.string().required().valid(joi.ref('password')).options({ allowUnknown: true })
        })

        const data = req.body;
        await signupSchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: [],
          });
    }
    next();
}

const loginValidation = async(req, res, next) => {
    try {
        const loginSchema = joi.object({
            email_or_phone:  [
                joi.number().min(10 ** 9).max(10 ** 10 - 1).required().messages({
                  'number.min': 'Mobile number should be 10 digit.',
                  'number.max': 'Mobile number should be 10 digit'
                }),
                joi.string().email().required().messages({
                    'string.email': 'Please add a valid email.',
                }),
              ],
            password: joi.string()
                    .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$'))
                    .required()
                    .messages({
                        "string.pattern.base":
                          "Password Must have at least 8 characters and one Uppercase one lowercase and a special character and number",
                      })
        })
        const data = req.body;
        await loginSchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const verifyOtpValidation = async(req, res, next) => {
    try {
        const verifySchema = joi.object({
            email_or_phone:  [
                joi.number().min(10 ** 9).max(10 ** 10 - 1).required().messages({
                  'number.min': 'Mobile number should be 10 digit.',
                  'number.max': 'Mobile number should be 10 digit'
                }),
                joi.string().email().required().messages({
                    'string.email': 'Please add a valid email.',
                }),
            ],
            type: joi.number().integer().min(0).max(4).required(),
            otp: joi.number().required().messages({"any.otp": "otp is required"})
        })

        const data = req.body;
        await verifySchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const otpValidation = async(req, res, next) => {
    try {
        const otpSchema = joi.object({
            email_or_phone: [
                joi.number().min(10 ** 9).max(10 ** 10 - 1).required().messages({
                  'number.min': 'Mobile number should be 10 digit.',
                  'number.max': 'Mobile number should be 10 digit'
                }),
                joi.string().email().required().messages({
                    'string.email': 'Please add a valid email.',
                }),
            ],
        })

        const data = req.body;
        await otpSchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const preferred_quote_currency = async(req, res, next) => {
    try {
        const currencySchema = joi.object({
            currency: joi.string().required()
        })

        const data = req.body;
        await currencySchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const twoFactorValidation = async(req, res, next) => {
    try {
        const currencySchema = joi.object({
            type: joi.number().min(0).max(3).required(),
            verification_code: joi.number().required().messages({"any.otp": "verification code is required"})
        })

        const data = req.body;
        await currencySchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const forgotPasswordValidation = async (req, res, next) => {
    try {
        const forgotPassSchema = joi.object({
            email_or_phone: [
                joi.number().min(10 ** 9).max(10 ** 10 - 1).required().messages({
                    'number.min': 'Mobile number should be 10 digit.',
                    'number.max': 'Mobile number should be 10 digit'
                }),
                joi.string().email().required().messages({
                    'string.email': 'Please add a valid email.',
                }),
            ],
            new_password: joi.string()
                .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$'))
                .required()
                .messages({
                    "string.pattern.base":
                        "New password Must have at least 8 characters and one Uppercase one lowercase and a special character and number",
                }),
            verification_code : joi.number().required().messages({'any.verification_code': 'verification_code is requied'})
        })
        const data = req.body;
        await forgotPassSchema.validateAsync(data, { allowUnknown: true, errors: { wrap: { label: '' } } })
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next();
}

const deleteUpiValidation = async(req, res, next) => {
    try {
        const upiSchema = joi.object({
            _id : joi.string().required().messages({"string._id": "id is required"})
        })

        const data = req.body;
        await upiSchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const changePasswordValidation = async (req, res, next) => {
    try {
        const passwordSchema = joi.object({
            old_password: joi.string().required().messages({'string.old_password': "Old Password is required"}),
            new_password : joi.string().required().messages({'string.new_password': "new Password is required"}),
            confirm_password: joi.string().required().valid(joi.ref('new_password')).options({ allowUnknown: true })
        })
        const data = req.body;
        await passwordSchema.validateAsync(data, { allowUnknown: true, errors: { wrap: { label: '' } } })
    } catch (error) {
        return res.status(422).json({success: false, message: error.message, data: []})
    }
    next();
}

module.exports = {
    loginValidation,
    verifyOtpValidation,
    otpValidation,
    signupValidation,
    preferred_quote_currency,
    twoFactorValidation,
    forgotPasswordValidation,
    changePasswordValidation,
    deleteUpiValidation
}