const joi = require('joi');

const adminValidator = async(req, res, next) => {
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
            first_name: joi.string().required().messages({"string.first_name": "first_name is required"}),
            last_name: joi.string().required().messages({"string.first_name": "first_name is required"}),
            password: joi.string()
                    .pattern(new RegExp('^(?=.*?[A-Z])(?=.*?[a-z])(?=.*?[0-9])(?=.*?[#?!@$%^&*-]).{8,}$'))
                    .required()
                    .messages({
                        "string.pattern.base":
                          "Password Must have at least 8 characters and one Uppercase one lowercase and a special character and number",
                      }),
            confirm_password: joi.string().required().valid(joi.ref('password')).options({ allowUnknown: true }),
            permissions: joi.array().min(1).required().messages({"array.permissions": "at least one permission is required to create a sub admin"}),
            admin_type: joi.number().messages({"any.admin_type": "admin type is required"})
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

const adminLoginValidation = async(req, res, next) => {
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

const coinCategoryValidation = async(req, res, next) => {
    try {
        const coinCatSchema = joi.object({
            name: joi.string().required().messages({"string.name": "category name is required"}),
        })
        const data = req.body;
        await coinCatSchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const editSubadminValidation = async(req, res, next) => {
    try {
        const subadminSchema = joi.object({
            id: joi.string().required().messages({"string.id": "Id is required"}),
            email_or_phone:  [
                joi.number().min(10 ** 9).max(10 ** 10 - 1).required().messages({
                  'number.min': 'Mobile number should be 10 digit.',
                  'number.max': 'Mobile number should be 10 digit'
                }),
                joi.string().email().required().messages({
                    'string.email': 'Please add a valid email.',
                }),
            ],
            first_name: joi.string().required().messages({"string.first_name": "first_name is required"}),
            last_name: joi.string().required().messages({"string.first_name": "first_name is required"}),
            permissions: joi.array().min(1).required().messages({"array.permissions": "at least one permission is required to create a sub admin"}),
            admin_type: joi.number().messages({"any.admin_type": "admin type is required"})
        })
        const data = req.body;
        await subadminSchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const addBankDetailsValidation = async (req, res, next) => {
    try {
        const addBankDetailsSchema = joi.object({
            //id: joi.string().required().messages({'string.id': "ID is required"}),
            bank_name: joi.string().required().messages({'string.bank_name': "Bank Name is required"}),
            account_number: joi.number().required().messages({'any.account_number': "Account Number is required"}),
            holder_name: joi.string().required().messages({'string.holder_name': "Holder Name is required"}),
            ifsc: joi.string().required().messages({'string.ifsc': "IFSC Code is required"}),
            branch: joi.string().required().messages({'string.branch': "Branch is required"})
        })
        const data = req.body;
        await addBankDetailsSchema.validateAsync(data, {allowUnknown: true, errors: {wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const deleteSubamdinValidation = async(req, res, next) => {
    try {
        const deletSubadminSchema = joi.object({
            _id: joi.string().required().messages({"string._id": "_id is required"}),
        })
        const data = req.body;
        await deletSubadminSchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const selectCoinValidation = async (req, res, next) => {
    try {
        const selectCoinSchema = joi.object({
            coinName: joi.string().required().messages({'string.coinName': "Coin Name is required"})
        })
        const data = req.body;
        await selectCoinSchema.validateAsync(data, {allowUnknown: true, errors: {wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const debitCreditValidation = async (req, res, next) => {
    try {
        const debitCreditSchema = joi.object({
            userId: joi.string().required().messages({'string.userId': 'User ID is required'}),
            coinId: joi.string().required().messages({'string.coinId': "Coin id is required"}),
            type: joi.string().required().messages({'string.type': "Type is required"}),
            amount: joi.number().required().messages({'any.amount': "amount is required"})
        })
        const data = req.body;
        await debitCreditSchema.validateAsync(data, {allowUnknown: true, errors: {wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const TransactionValidation = async (req, res, next) => {
    try {
        const transactionSchema = joi.object({
            userId: joi.string().required().messages({'string.userId': "User ID is required"})
        })
        const data = req.body;
        await transactionSchema.validateAsync(data, {allowUnknown: true, errors: {wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const updateStatusValidation = async (req, res, next) => {
    try {
        const updateStatusSchema = joi.object({
            _id : joi.string().required().messages({'string._id': "Id is required"}),
            status : joi.string().required().messages({'string.status': "Status is required"})
        })
        const data = req.body;
        await updateStatusSchema.validateAsync(data, { allowUnknown: true, errors: { wrap: { label: '' } } })
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const notificationValidation = async(req, res, next) => {
    try {
        const notificationSchema = joi.object({
            title: joi.string().required().messages({"string.title": "title is required"}),
            message: joi.string().required().messages({"string.message": "message is required"})
        })
        const data = req.body;
        await notificationSchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const deleteNotificationValidation = async(req, res, next) => {
    try {
        const deletNotificationSchema = joi.object({
            _id: joi.string().required().messages({"string.id": "_id is required"}),
        })
        const data = req.body;
        await deletNotificationSchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: ''}}})
    } catch (error) {
        return res.status(422).json({
            success: false,
            message: error.message,
            data: []
        })
    }
    next()
}

const p2pCurrencyValidation = async (req, res, next) => {
    try {
        const p2pSchema = joi.object({
            currency_short_name : joi.string().required().messages({"string.currency_short_name": "currency_short_name is required"}),
        })
        const data = req.body;
        await p2pSchema.validateAsync(data, {allowUnknown: true, errors: { wrap: {label: '' }}} )
    } catch (error) {
        return res.status(422).json({success: false, message: error.message, data: []})
    }
    next()
}



module.exports = {
    adminValidator,
    adminLoginValidation,
    coinCategoryValidation,
    editSubadminValidation,
    deleteSubamdinValidation,
    updateStatusValidation,
    notificationValidation,
    deleteNotificationValidation,
    addBankDetailsValidation,
    selectCoinValidation,
    debitCreditValidation,
    TransactionValidation,
    updateStatusValidation,
    p2pCurrencyValidation
}