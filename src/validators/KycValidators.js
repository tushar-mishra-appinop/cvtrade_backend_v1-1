const joi = require("joi");

const kycValidation = async (req, res, next) => {
    try {
        
        const submitKycSchema = joi.object({
            country: joi.string().required().messages({"any.country": "please select country from dropdown"}),
            kyc_type: joi.string().valid("Personal", "Company").required()
                .messages({
                    "string.valid": "Please enter valid kyc type!",
                    "any.required": "Please enter valid kyc type!",
                }),
            sub_kyc_type: joi
                .string()
                .valid('Personal',"HUF", "Limited Liability Partnership (LLP)", "Limited Company")
                .messages({
                    "string.valid": "Please enter valid sub type of kyc!",
                    "any.required": "Please enter valid sub type of kyc!",
                }),
            first_name: joi
                .string()
                .required()
                .messages({ "string.first_name": "first name is required" }),
            middle_name: joi
                .string()
                .messages({ "string.middle_name": "first name is required" }),
            last_name: joi
                .string()
                .required()
                .messages({ "string.last_name": "first name is required" }),
            dob: joi
                .date()
                .required({ "date.dob": "Please enter a valid date of birth" }),
            address: joi
                .string()
                .required()
                .messages({ "string.address": "address is required" }),
            state: joi
                .string()
                .required()
                .messages({ "string.state": "state is invalid" }),
            city: joi
                .string()
                .required()
                .messages({ "string.city": "city is invalid" }),
            zip_code: joi.number().required().messages({
                "number.zip_code": "please enter a valid zip code",
            }),
            pancard_number: joi
                .string()
                .alphanum()
                .regex(new RegExp("^[A-Z]{5}[0-9]{4}[A-Z]{1}$"))
                .label("pancard_number")
                .when("country", {
                    is: "India",
                    then: joi.string().required().messages({
                        "any.required": "PAN Card Number is required for India",
                    }),
                    otherwise: joi.string().allow("", null), // Allow an empty value for non-India countries
                })
                .messages({
                    "string.pattern.base": "PAN Card number must have 5 letters, 4 numbers, and one character",
                }),
            confirm_pancard_number: joi
                .any()
                .valid(joi.ref("pancard_number"))
                .required(),
            document_type: joi
                .string()
                .valid("Aadhaar", "Passport", "Driving License")
                .required()
                .messages({
                    "string.valid": "Please enter valid document type!",
                    "any.required": "Please enter valid document type!",
                }),
            document_number: joi
                .when("document_type", {
                    is: joi.exist().valid("Aadhaar"),
                    then: joi.number().required(),
                })
                .messages({
                    "any.required": "please enter valid aadhar number",
                }),
            // confirm_document_number: joi
            //     .any()
            //     .valid(joi.ref("document_number"))
            //     .required(),
        });

        const data = req.body;
        await submitKycSchema.validateAsync(data, {
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
};

module.exports = {
    kycValidation,
};
