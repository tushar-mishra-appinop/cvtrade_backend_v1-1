const Users = require('../models/Users');
const Otps = require('../models/Otps');
const UserKyc = require('../models/Kyc');
const Referral = require("../models/Referral");
const Favorite = require('../models/FavoriteCurrency');
const Bcrypt = require("../utils/Bcrypt");
const logs = require('../models/logs');
const UserBanks = require('../models/UserBankDetails');
const userUpiDetails = require('../models/userUpiDetails');
const JWT = require("../utils/Jwt");
const Speakeasy = require("speakeasy");
const QRcode = require("qrcode");
const { create_wallet2 } = require('./WalletController')
const { check_type, generate_otp, generateReferCode, upiValidation, generateRandomString } = require("../utils/Utils");
const { email_marketing, mobile_marketing } = require('../utils/Marketing');
const { PROJECT_NAME } = process.env;
const JWT_SECRET = 'cvtrade_apis_secret'
const JWT_EXPIRY_TIME = '24h'
// const { google_assesment, google_assesment2 } = require('../middleware/GoogleCaptcha');
const { ifscValidation } = require('../utils/IfscValidation');
const Partnership = require('../models/Partnership');
const axios = require('axios');
const Wallets = require('../models/Wallets');
// const { setDetails } = require('../middleware/Redis')
const { errorHandler } = require('../utils/CustomError')
const CoinListedDetails = require("../models/coinlisteddetails");


module.exports = {
    signup: async (req, res) => {
        try {
            const { email_or_phone, referral_code, country_code, verification_code, token } = req.body;
            let { password } = req.body;
            let check = await check_type(email_or_phone);
            if (referral_code) {
                await Referral.checkReferralCode(referral_code);
            }
            // Check if user already exists
            let find;
            if (check == "email") {
                find = await Users.findOne({ emailId: email_or_phone }).select("email");
            } else {
                find = await Users.findOne({ mobileNumber: email_or_phone }).select("phone");
            }
            if (find != null) {
                return res.status(409).json({
                    success: false,
                    message: `User with this ${check} is already registered`,
                    data: [],
                });
            }

            // Find OTP for verification
            let find_otp = await Otps.findOne({ email_or_phone: email_or_phone }).select('otp');
            if (find_otp === null) {
                return res.status(404).json({ success: false, message: 'please send otp first', data: [] });
            } else {
                if (find_otp.otp != verification_code) {
                    return res.status(403).json({ success: false, message: 'verification code not matched', data: [] });
                }
            }

            // Encrypt password
            password = await Bcrypt.passwordEncryption(password);

            // Create user
            let register;
            if (check == "email") {
                register = await Users.create({
                    emailId: email_or_phone,
                    password: password,
                    registerdBy: check
                });
            } else {
                register = await Users.create({
                    mobileNumber: email_or_phone,
                    password: password,
                    country_code: country_code || "+91",
                    registerdBy: check
                });
            }
            await create_wallet2(register._id);
            // Generate referral code
            let code = await generateReferCode(check, email_or_phone);

            await Referral.createNewUser(register._id, code)
            // If referral code is provided, update total_refer count


            if (referral_code) {
                // Check if the referral code exists
                let sponsor = await Referral.checkReferralCode(referral_code);
                if (sponsor) {
                    // Credit the referral
                    await Referral.updateReferral(register._id, code, referral_code, sponsor.userId);
                    // Increment total_refer by 1 for the sponsor
                    await Users.updateOne(
                        { _id: sponsor.userId },
                        { $inc: { total_refer: 1 } }
                    );
                    // Increment the balance of the sponsor
                    await Wallets.findOneAndUpdate(
                        { user_id: sponsor.userId, short_name: "SHIB" },
                        { $inc: { balance: 5000 } },
                        { new: true }
                    );
                }
            }

            // Generate JWT token
            let jwt_data;
            if (check == 'email') {
                let response = {
                    userId: register._id,
                    emailId: register.emailId,
                    firstName: register.firstName,
                    lastName: register.lastName,
                    verfied: register.verified,
                    ['2fa']: register['2fa']
                };
                jwt_data = response;
                let token = await JWT.generate_token(jwt_data, process.env.JWT_SECRET, process.env.JWT_EXPIRY_TIME);
                jwt_data.token = token;
                await email_marketing('registration', "message", register.emailId);
            } else {
                let response = {
                    userId: register._id,
                    mobileNumber: register.mobileNumber,
                    firstName: register.firstName,
                    lastName: register.lastName,
                    verfied: register.verified,
                    ['2fa']: register['2fa']
                };
                jwt_data = response;
                let token = await JWT.generate_token(jwt_data, process.env.JWT_SECRET, process.env.JWT_EXPIRY_TIME);
                jwt_data.token = token;
            }
            // if there is no error then update the balance of signup_person
            await Wallets.findOneAndUpdate(
                { user_id: register._id, short_name: "SHIB" },
                { $inc: { balance: 5000 } },
                { new: true }
            );
            // Send success response
            return res.status(200).json({
                success: true,
                message: "Registration Successfull",
                data: jwt_data,
            });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },

    login: async (req, res) => {
        try {
            const { email_or_phone, password, token } = req.body;
            let check = await check_type(email_or_phone);
            let user;
            if (check == "email") {
                user = await Users.findOne({ emailId: email_or_phone });
            } else {
                user = await Users.findOne({ mobileNumber: email_or_phone });
            }


            if (user == null) {
                return res.status(404).json({
                    success: false,
                    message: `no user is registered with this ${check}`,
                    data: [],
                });
            } else {
                let code = await generateReferCode(check, email_or_phone);
                let find_ref = await Referral.findReferralByUserId(user._id)
                if (!find_ref) {
                    let update_referal = await Referral.createNewUser(user._id, code)
                }



                let compare = await Bcrypt.passwordComparison(
                    password,
                    user.password
                );
                if (!compare) {
                    return res.status(401).json({
                        success: false,
                        message: `Invalid password for this ${check}`,
                        data: [],
                    });
                } else {
                    if (user.status != 'Active') {
                        return res.status(406).json({ success: false, message: 'Your Account is suspended due to some suspicious activity please contact to support for more inquiry' })
                    }

                    let response_login;
                    if (check == "email") {
                        response_login = {
                            userId: user.id,
                            emailId: user.emailId,
                            mobileNumber: user.mobileNumber,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            verified: user.verified,
                            ["2fa"]: user["2fa"],
                        };
                    } else {
                        response_login = {
                            userId: user.id,
                            emailId: user.emailId,
                            mobileNumber: user.mobileNumber,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            verified: user.verified,
                            ["2fa"]: user["2fa"],
                        };
                    }
                    let jwt_data = response_login;

                    // send otp for 2fa
                    if (user["2fa"] === 1) {
                        // send otp on email
                        let otp = await generate_otp();
                        let update_otp = await Otps.updateOne(
                            { email_or_phone: email_or_phone },
                            { $set: { otp: otp } },
                            { upsert: true }
                        );
                        await email_marketing(
                            "verification",
                            otp,
                            user.emailId
                        );
                    } else if (user["2fa"] === 3) {
                        // send otp on mobile
                        let otp = await generate_otp();
                        let update_otp = await Otps.updateOne(
                            { email_or_phone: user.mobileNumber },
                            { $set: { otp: otp } },
                            { upsert: true }
                        );
                        await mobile_marketing(
                            "verification",
                            otp,
                            user.mobileNumber
                        );
                    } else if (user["2fa"] === 2) {

                        // For google
                    } else if (user["2fa"] === 0) {

                        let token = await JWT.generate_token(
                            jwt_data,
                            process.env.JWT_SECRET,
                            process.env.JWT_EXPIRY_TIME
                        );
                        jwt_data.token = token;


                        // Send a login notification
                        let message = {
                            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                            time: new Date(),
                            name: user.firstName + ' ' + user.lastName
                        }



                        if (jwt_data.emailId === '') {
                            await email_marketing('login', message, jwt_data.mobileNumber)
                        }

                        await email_marketing('login', message, jwt_data.emailId)

                    }

                    // Add Logs
                    let activity_data = {};
                    activity_data.Activity = "Login",
                        activity_data.IP = req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                        activity_data.userId = user._id,
                        activity_data.date = new Date();

                    let add_logs = await logs.create(activity_data)


                    return res.status(200).json({
                        success: true,
                        message: "login successful",
                        data: jwt_data,
                        ...(req.body.referral_code ? { message2: "5000 shib is successfully added to your account by referrals" } : {})
                    });

                }
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },
    thirdPartyLogin: async (req, res) => {
        try {
            const { Token, type, referral_code } = req.body;
            let data, user;

            if (!Token || !type) {
                return res.status(400).json({
                    success: false,
                    message: "Token and type are required for login.",
                    data: []
                });
            }

            if (type !== "google") {
                return res.status(400).json({
                    success: false,
                    message: "Unsupported login type. Only 'google' login type is supported.",
                    data: []
                });
            }

            // Fetch user data from Google using the token
            const googleUserInfo = await axios.get('https://www.googleapis.com/oauth2/v3/userinfo', {
                headers: {
                    'Authorization': `Bearer ${Token}`
                }
            });

            const userData = googleUserInfo.data;

            // Prepare user data with necessary fields
            const mappedUserData = {
                firstName: userData.given_name,
                lastName: userData.family_name,
                emailId: userData.email,
                sub: userData.sub // Assigning 'sub' from Google user data
            };

            // Check if user already exists with the same email
            user = await Users.findOne({ emailId: userData.email });

            if (user === null) {
                // If the user doesn't exist, create a new user
                user = await Users.create(mappedUserData);

                // Generate referral code for the new user
                let code = await generateReferCode("email", userData.email);

                // Update referral code for the user
                let update_referal = await Referral.updateReferral(user._id, code);
            }

            // Generate JWT token
            let jwtData = {
                userId: user._id, // Assuming user._id is the correct identifier
                emailId: user.emailId,
                firstName: user.firstName,
                lastName: user.lastName,
                sub: user.sub, // Include the 'sub' field from the user
                // Include other relevant user data here
            };

            if (!JWT_SECRET) {
                throw new Error("JWT secret is not defined or empty.");
            }

            const token = await JWT.generate_token(jwtData, JWT_SECRET, JWT_EXPIRY_TIME);

            // Prepare data for response
            jwtData.token = token

            return res.status(200).json({ success: true, message: "Login Successful", data: jwtData });
        } catch (err) {
            console.error("Error in thirdPartyLogin:", err);
            return res.status(500).json({ success: false, message: err.message, data: [] });
        }
    },


    verify_otp: async (req, res) => {
        try {
            const { email_or_phone, type, otp } = req.body;
            let check = await check_type(email_or_phone);
            if (type === 1) {
                if (check != "email") {
                    return res.status(406).json({
                        success: false,
                        message: "invalid payload for type 1",
                        data: [],
                    });
                }
                // 2FA on email
                let user_otp = await Otps.findOne({
                    email_or_phone: email_or_phone,
                })
                if (user_otp === null) {
                    return res.status(200).json({
                        success: true,
                        message: "please send otp first",
                        data: [],
                    });
                } else {
                    if (user_otp.otp != otp) {
                        return res.status(406).json({
                            success: false,
                            message: "otp not matched",
                            data: [],
                        });
                    } else {
                        let user = await Users.findOne({
                            emailId: email_or_phone,
                        });
                        let jwt_data = {
                            userId: user.id,
                            emailId: user.emailId,
                            mobileNumber: user.mobileNumber,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            verified: user.verified,
                            ["2fa"]: user["2fa"],
                        };
                        let token = await JWT.generate_token(
                            jwt_data,
                            process.env.JWT_SECRET,
                            process.env.JWT_EXPIRY_TIME
                        );
                        jwt_data.token = token;
                        // Send a login notification
                        let message = {
                            ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                            time: new Date()
                        }
                        await email_marketing('login', message, jwt_data.emailId)
                        return res.status(200).json({
                            success: true,
                            message: "login successfull",
                            data: jwt_data,
                        });
                    }
                }
            } else if (type === 2) {
                // 2FA on Google Authenticator app
                let check = await check_type(email_or_phone);
                let user;
                if (check == "email") {
                    user = await Users.findOne({ emailId: email_or_phone });
                } else {
                    user = await Users.findOne({ mobileNumber: email_or_phone });
                }

                let tokenValidates = await Speakeasy.totp.verify({
                    secret: user.google_auth.base32,
                    encoding: "base32",
                    token: otp,
                });


                if (tokenValidates) {
                    let jwt_data = {
                        userId: user.id,
                        emailId: user.emailId,
                        mobileNumber: user.mobileNumber,
                        firstName: user.firstName,
                        lastName: user.lastName,
                        verified: user.verified,
                        ["2fa"]: user["2fa"],
                    };
                    let token = await JWT.generate_token(
                        jwt_data,
                        process.env.JWT_SECRET,
                        process.env.JWT_EXPIRY_TIME
                    );
                    jwt_data.token = token;
                    return res.status(200).json({
                        success: true,
                        message: "otp matched",
                        data: jwt_data,
                    });
                } else {
                    return res.status(500).json({
                        success: false,
                        message: "invalid code",
                        data: [],
                    });
                }
            } else if (type === 3) {
                //  2FA on mobile
                if (check != "phone") {
                    return res.status(406).json({
                        success: false,
                        message: "invalid payload for type 2",
                        data: [],
                    });
                }

                let user_otp = await Otps.findOne({
                    email_or_phone: email_or_phone,
                })

                if (user_otp === null) {
                    return res.status(200).json({
                        success: false,
                        message: "please send otp first",
                        data: [],
                    });
                } else {
                    if (user_otp.otp != otp) {
                        return res.status(406).json({
                            success: false,
                            message: "otp not matched",
                            data: [],
                        });
                    } else {
                        let user = await Users.findOne({
                            mobileNumber: email_or_phone,
                        });
                        let jwt_data = {
                            userId: user.id,
                            emailId: user.email,
                            mobileNumber: user.mobileNumber,
                            firstName: user.firstName,
                            lastName: user.lastName,
                            verified: user.verified,
                            ["2fa"]: user["2fa"],
                        };
                        let token = await JWT.generate_token(
                            jwt_data,
                            process.env.JWT_SECRET,
                            process.env.JWT_EXPIRY_TIME
                        );
                        jwt_data.token = token;
                        return res.status(200).json({
                            success: true,
                            message: "otp matched",
                            data: jwt_data,
                        });
                    }
                }
            }
        } catch (error) {
            return res.status(500).json({ success: true, message: error.message, data: [] })
        }
    },

    send_otp: async (req, res) => {
        try {
            const { email_or_phone, resend, type } = req.body;
            if (type === "registration") {
                let check = await check_type(email_or_phone);
                let user
                if (check == 'email') {
                    user = await Users.findOne({ emailId: email_or_phone });
                } else {
                    user = await Users.findOne({ mobileNumber: email_or_phone });
                }
                if (user != null) {
                    return res.status(406).json({ success: false, message: `User is already registered with this ${check}` })
                }
            } else if (type === 'forgot') {
                let check = await check_type(email_or_phone);
                let user
                if (check == 'email') {
                    user = await Users.findOne({ emailId: email_or_phone });
                } else {
                    user = await Users.findOne({ mobileNumber: email_or_phone });
                }
                if (user === null) {
                    return res.status(406).json({ success: false, message: `No user is registered with this ${check}` })
                }
            }
            let otp = await generate_otp();
            let check = await check_type(email_or_phone);

            if (resend) {
                let update = await Otps.updateOne(
                    { email_or_phone: email_or_phone },
                    { $set: { otp: otp } },
                    { upsert: true }
                );
                if (update.upsertedCount > 0 || update.modifiedCount > 0) {
                    if (check === "email") {
                        await email_marketing(
                            "verification",
                            otp,
                            email_or_phone,
                        );
                    } else {
                        await mobile_marketing(
                            "verification",
                            otp,
                            email_or_phone
                        );
                        let update = await Otps.updateOne(
                            { email_or_phone: email_or_phone },
                            { $set: { otp: otp } },
                            { upsert: true }
                        );
                    }
                    return res.status(200).json({
                        success: true,
                        message: `otp sent successfully`,
                        data: [],
                    });
                } else {
                    return res.status(500).json({
                        success: false,
                        message: "some error occured on server",
                        data: [],
                    });
                }
            } else {
                let find = await Otps.findOne({
                    email_or_phone: email_or_phone,
                }).select("otp");
                if (find == null) {
                    let update = await Otps.updateOne(
                        { email_or_phone: email_or_phone },
                        { $set: { otp: otp } },
                        { upsert: true }
                    );
                    if (update.upsertedCount > 0 || update.modifiedCount > 0) {
                        if (check === "email") {
                            await email_marketing(
                                "verification",
                                otp,
                                email_or_phone
                            );
                        } else {
                            await mobile_marketing(
                                "verification",
                                otp,
                                email_or_phone
                            );
                            let update = await Otps.updateOne(
                                { email_or_phone: email_or_phone },
                                { $set: { otp: otp } },
                                { upsert: true }
                            );
                        }
                        return res.status(200).json({
                            success: true,
                            message: "otp send successfully",
                            data: [],
                        });
                    }
                } else {
                    return res.status(200).json({
                        success: false,
                        message: "we have already sent you a otp",
                        data: [],
                    });
                }
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    user_profile: async (req, res) => {
        try {
            const { userId } = req.user;
            // Find user by _id or sub
            let user = await Users.findOne(
                { $or: [{ _id: userId }, { sub: userId }] },
                { password: 0 }
            );

            if (user) {
                // Calculate registered days if needed
                const currentDate = new Date();
                const registrationDate = user.createdAt;
                const timeDifference = currentDate - registrationDate;
                const diffDays = Math.floor(timeDifference / (1000 * 60 * 60 * 24));

                // Update registeredDays field in the database if needed
                // For example, you may update registeredDays only if it's not already set
                // if (!user.registeredDays) {
                const updatedUser = await Users.findOneAndUpdate({ $or: [{ _id: userId }, { sub: userId }] }, { $set: { registeredDays: diffDays } }, { new: true });
                // }
                return res.status(200).json({ success: true, message: 'User details fetched successfully', data: updatedUser });
            } else {
                return res.status(403).json({ success: false, message: 'No user found with this id or sub', data: [] });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },


    submit_kyc: async (req, res) => {
        try {
            const { userId } = req.user;
            let pancard_image;
            let user_selfie;
            let document_front_image;
            let document_back_image;
            if (Object.keys(req.files).length != 4) {
                return res.send({ success: false, message: "Please Upload All Images" })
            }

            if (req.files.pancard_image[0].path) {
                pancard_image = req.files.pancard_image[0].path.split('/').slice(1).join('/');
            }
            if (req.files.user_selfie[0].path) {
                user_selfie = req.files.user_selfie[0].path.split('/').slice(1).join('/');
            }
            if (req.files.document_front_image[0].path) {
                document_front_image = req.files.document_front_image[0].path.split('/').slice(1).join('/');
            }
            if (req.files.document_back_image[0].path) {
                document_back_image = req.files.document_back_image[0].path.split('/').slice(1).join('/');
            }

            let data = req.body;
            let mobileNumber = data.mobileNumber;

            data.userId = userId;
            data.pancard_image = pancard_image;
            data.user_selfie = user_selfie;
            data.document_front_image = document_front_image;
            data.document_back_image = document_back_image;
            delete data.confirm_document_number;
            delete data.confirm_pancard_number;

            // Check if email or mobile number already exists for this user
            const userExists = await Users.findOne({ _id: userId });
            if (userExists) {
                if (userExists.registerdBy === "phone") {
                    if (userExists.emailId) {

                    }
                    else {
                        if (!data.emailId) {
                            return res.status(400).json({
                                success: false,
                                message: "Please Add Email-ID First",
                                data: []
                            });
                        }
                        const userWithemail = await Users.findOne({ emailId: data.emailId });

                        if (userWithemail) {
                            // Mobile number already exists
                            return res.status(400).json({
                                success: false,
                                message: "Email Already Exists",
                                data: []
                            });
                        }
                        let email_otp = await Otps.findOne({ email_or_phone: data.emailId });
                        if (!email_otp) {
                            return res.status(401).json({ success: false, message: 'Please send email otp first' });
                        } else {
                            if (email_otp.otp != data.eotp) {
                                return res.status(402).json({ success: false, message: 'email otp not matched' });
                            }
                        }

                    }


                } else if (userExists.registerdBy === "email") {
                    if (userExists.mobileNumber) {

                    }
                    else {
                        if (!mobileNumber) {
                            return res.status(400).json({
                                success: false,
                                message: "Please Add Mobile Number",
                                data: []
                            });
                        }
                        const userWithMobileNumber = await Users.findOne({ mobileNumber: mobileNumber });

                        if (userWithMobileNumber) {
                            // Mobile number already exists
                            return res.status(400).json({
                                success: false,
                                message: "Mobile Number Already Exists",
                                data: []
                            });
                        }
                        // Check mobile OTP verification
                        let mobile_otp = await Otps.findOne({ email_or_phone: mobileNumber })
                        if (!mobile_otp) {
                            return res.status(401).json({ success: false, message: 'Please send mobile otp first' });
                            // throw await errorHandler('Please send mobile otp first', 403)
                        } else {
                            if (mobile_otp.otp != req.body.motp) {
                                return res.status(402).json({ success: false, message: 'mobile otp not matched' });
                            }
                        }
                    }



                }
            }

            // Update user data
            let updateKyc = await UserKyc.updateOne(
                { userId: data.userId },
                {
                    $set: {
                        country: data.country,
                        kyc_type: data.kyc_type,
                        sub_kyc_type: data.sub_kyc_type,
                        first_name: data.first_name,
                        middle_name: data.middle_name,
                        last_name: data.last_name,
                        dob: data.dob,
                        address: data.address,
                        state: data.state,
                        city: data.city,
                        zip_code: data.zip_code,
                        pancard_number: data.pancard_number,
                        emailId: data.emailId,
                        mobileNumber: data.mobileNumber,
                        document_type: data.document_type,
                        document_number: data.document_number,
                        pancard_image: data.pancard_image,
                        user_selfie: data.user_selfie,
                        document_front_image: data.document_front_image,
                        document_back_image: data.document_back_image,
                        ton_address: data.ton_address
                    }
                },
                { upsert: true }
            );

            if (updateKyc.upsertedCount > 0 || updateKyc.modifiedCount > 0) {
                // Update user's KYC status
                if (userExists.registerdBy === "email") {
                    await Users.updateOne(
                        { _id: userId },
                        { $set: { kycVerified: 1, firstName: data.firstName, lastName: data.lastName, mobileNumber: mobileNumber } },
                        { upsert: true }
                    );
                } else if (userExists.registerdBy === "phone") {
                    await Users.updateOne(
                        { _id: userId },
                        { $set: { kycVerified: 1, firstName: data.firstName, lastName: data.lastName, emailId: data.emailId } },
                        { upsert: true }
                    );
                }

                // Log activity
                let activity_data = {
                    Activity: "KYC Submitted",
                    IP: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                    userId: userId,
                    date: new Date()
                };
                let add_logs = await logs.create(activity_data);

                return res.status(200).json({
                    success: true,
                    message: "KYC submitted successfully",
                    data: []
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message: "Error updating KYC",
                    data: []
                });
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: "Internal Server Error",
                data: []
            });
        }
    },



    edit_profile: async (req, res) => {
        try {
            const { userId } = req.user;
            let { firstName, lastName, emailId, mobileNumber, eotp, motp } = req.body;
            let profilepicture;
            if (req.file !== undefined) {
                profilepicture = req.file.path;
                profilepicture = profilepicture.split('/');
                profilepicture = profilepicture[1] + '/' + profilepicture[2];
            } else {
                const user = await Users.findOne({ _id: userId }).select('profilepicture');
                profilepicture = user.profilepicture;
            }

            if ((mobileNumber === "" || emailId === "") && (mobileNumber || emailId)) {
                const update_profile = await Users.updateOne(
                    { _id: userId },
                    {
                        $set: {
                            firstName: firstName,
                            lastName: lastName,
                            profilepicture: profilepicture,
                            emailId: emailId,
                        }
                    },
                    { upsert: true }
                );

                if (update_profile.upsertedCount > 0 || update_profile.modifiedCount > 0) {
                    // Log activity
                    let activity_data = {
                        Activity: "Profile Updated",
                        IP: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                        userId: userId,
                        date: new Date()
                    };
                    let add_logs = await logs.create(activity_data);
                    return res.status(200).json({ success: true, message: 'Profile updated successfully', data: [] });
                } else {
                    console.log("error");
                }
            } else if (mobileNumber && emailId) {

                let user = await Users.findOne({ _id: userId });

                if (user.emailId === '') {

                    let email_otp = await Otps.findOne({ email_or_phone: emailId });
                    if (!email_otp) {
                        return res.status(401).json({ success: false, message: 'Please send email otp first' });
                    } else {
                        if (email_otp.otp != eotp) {
                            return res.status(402).json({ success: false, message: 'email otp not matched' });
                        }
                    }
                } else if (user.mobileNumber === '') {

                    let mobile_otp = await Otps.findOne({ email_or_phone: mobileNumber })
                    if (!mobile_otp) {
                        return res.status(401).json({ success: false, message: 'Please send mobile otp first' });
                        // throw await errorHandler('Please send mobile otp first', 403)
                    } else {
                        if (mobile_otp.otp != motp) {
                            return res.status(402).json({ success: false, message: 'mobile otp not matched' });
                        }
                    }
                }
            }


            // Check if both emailId and eotp are provided for email verification
            // if (emailId && eotp) {
            //     const check_email_otp = await Otps.findOne({ email_or_phone: emailId });
            //     if (!check_email_otp || check_email_otp.otp !== parseInt(eotp)) {
            //         return res.status(400).json({ success: false, message: "Email Verification Code not matched" });
            //     }
            // }
            // // Check if both mobileNumber and motp are provided for mobile verification
            // if (mobileNumber && motp) {
            //     const check_mobile_otp = await Otps.findOne({ email_or_phone: mobileNumber });

            //     if (!check_mobile_otp || check_mobile_otp.otp !== parseInt(motp)) {
            //         return res.status(400).json({ success: false, message: "Mobile Verification Code not matched" });
            //     }
            // }

            // Check if emailId is already linked with another account
            const emailExists = await Users.exists({ _id: { $ne: userId }, emailId: emailId });
            if (emailExists) {
                return res.status(403).json({ success: false, message: 'Email is already linked with another account', data: [] });
            }

            // Check if mobileNumber is already linked with another account
            const mobileExists = await Users.exists({ _id: { $ne: userId }, mobileNumber: mobileNumber });
            if (mobileExists) {
                return res.status(403).json({ success: false, message: 'Mobile number is already linked with another account', data: [] });
            }


            let data = await Users.find({ $and: [{ mobileNumber: mobileNumber }, { _id: { $ne: userId } }, { mobileNumber: { $ne: '' } }] });
            if (data.length > 0) {
                throw await errorHandler(`${mobileNumber} is already linked with another account`, 406)
            }
            let data1 = await Users.find({ $and: [{ emailId: emailId }, { _id: { $ne: userId } }, { emailId: { $ne: '' } }] });
            if (data1.length > 0) {
                throw await errorHandler(`${emailId} is already linked with another account`, 406)
            }
            // Update user profile
            const update_profile = await Users.updateOne(
                { _id: userId },
                {
                    $set: {
                        firstName: firstName,
                        lastName: lastName,
                        profilepicture: profilepicture,
                        emailId: emailId,
                        mobileNumber: mobileNumber
                    }
                },
                { upsert: true }
            );

            if (update_profile.upsertedCount > 0 || update_profile.modifiedCount > 0) {
                // Log activity
                let activity_data = {
                    Activity: "Profile Updated",
                    IP: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                    userId: userId,
                    date: new Date()
                };
                let add_logs = await logs.create(activity_data);

                return res.status(200).json({ success: true, message: 'Profile updated successfully', data: [] });
            } else {
                return res.status(500).json({ success: false, message: 'Some error occurred while updating your profile, please try again later', data: [] });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },




    generate_google_qr: async (req, res) => {
        try {

            const { userId } = req.user;
            let secret = await Speakeasy.generateSecret();


            let user = await Users.findOne({ _id: userId });


            if (user.google_auth === null) {
                let update_google = await Users.updateOne(
                    { _id: userId },
                    { $set: { google_auth: secret } },
                    { upsert: true }
                );
                var url = Speakeasy.otpauthURL({
                    secret: secret.ascii,
                    label: PROJECT_NAME + userId,
                });
                let qr = await QRcode.toDataURL(url);
                if (
                    update_google.upsertedCount > 0 ||
                    update_google.modifiedCount > 0
                ) {
                    return res.status(200).json({
                        success: true,
                        message:
                            "Qr for google authenticator generated successfully",
                        data: {
                            secret: secret,
                            qr_code: qr,
                        },
                    });
                } else {
                    return res.status(500).json({
                        success: false,
                        message: "some error occured on server",
                        data: [],
                    });
                }
            } else {
                var url = Speakeasy.otpauthURL({
                    secret: user.google_auth.ascii,
                    label: PROJECT_NAME + userId,
                });
                let qr = await QRcode.toDataURL(url);
                return res.status(200).json({
                    success: true,
                    message:
                        "Qr for google authenticator generated successfully",
                    data: {
                        secret: user.google_auth,
                        qr_code: qr,
                    },
                });
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: [],
            });
        }
    },

    currency_prefrence: async (req, res) => {
        try {
            const { userId } = req.user;
            const { currency } = req.body;

            let update = await Users.updateOne(
                { _id: userId },
                { $set: { currency_prefrence: currency } },
                { upsert: true }
            );
            if (update.upsertedCount > 0 || update.modifiedCount > 0) {
                return res.status(200).json({
                    success: true,
                    message: "Currency prefrence updated succesfully",
                    data: [],
                });
            } else {
                return res.status(500).json({
                    success: false,
                    message:
                        "some error occured on server please try again later",
                    data: [],
                });
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: [],
            });
        }
    },

    enable_2fa: async (req, res) => {
        try {
            const { userId } = req.user;
            const { type, verification_code, email_or_phone } = req.body;

            if (type === 1) {
                // for email
                let user_otp = await Otps.findOne({
                    email_or_phone: email_or_phone,
                }).select("otp");
                if (user_otp === null) {
                    return res.status(200).json({
                        success: true,
                        message: "please send otp first",
                        data: [],
                    });
                } else if (user_otp.otp != verification_code) {
                    return res.status(500).json({
                        success: false,
                        message: "verification code not matched",
                        data: [],
                    });
                }
            } else if (type === 3) {
                // for mobile
                let user_otp = await Otps.findOne({
                    email_or_phone: email_or_phone,
                }).select("otp");

                if (user_otp === null) {
                    return res.status(200).json({
                        success: true,
                        message: "please send otp first",
                        data: [],
                    });
                } else if (user_otp.otp != verification_code) {
                    return res.status(500).json({
                        success: false,
                        message: "verification code not matched",
                        data: [],
                    });
                }
            } else if (type === 2) {
                // for google
                let check = await check_type(email_or_phone);
                let user;
                if (check == "email") {
                    user = await Users.findOne({ emailId: email_or_phone });
                } else {
                    user = await Users.findOne({ mobileNumber: email_or_phone });
                }

                var tokenValidates = await Speakeasy.totp.verify({
                    secret: user.google_auth.base32,
                    encoding: "base32",
                    token: verification_code,
                });


                if (!tokenValidates) {
                    return res.status(500).json({
                        success: false,
                        message: "verification code not matched",
                        data: [],
                    });
                }
            } else {
                let user_otp = await Otps.findOne({
                    email_or_phone: email_or_phone,
                }).select("otp");
                if (user_otp == null) {
                    return res.status(200).json({
                        success: true,
                        message: "please send otp first",
                        data: [],
                    });
                } else if (user_otp.otp != verification_code) {
                    return res.status(500).json({
                        success: false,
                        message: "verification code not matched",
                        data: [],
                    });
                }
            }

            let update = await Users.updateOne(
                { _id: userId },
                { $set: { ["2fa"]: type } },
                { upsert: true }
            );
            if (update.upsertedCount > 0 || update.modifiedCount > 0) {
                if (type != 0) {
                    return res.status(200).json({
                        success: true,
                        message: "Two factor authentication activated!!",
                        data: [],
                    });
                } else {
                    return res.status(200).json({
                        success: true,
                        message: "Two factor authentication deactivated!!",
                        data: [],
                    });
                }
            } else {
                return res.status(500).json({
                    success: false,
                    message:
                        "some error occured on server please try again later",
                    data: [],
                });
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: [],
            });
        }
    },

    get_ip: async (req, res) => {
        var ip = req.headers['x-forwarded-for'] || req.socket.remoteAddress


    },

    update_favorite_coin: async (req, res) => {
        try {
            const { userId } = req.user;
            const { pair_id } = req.body;

            let exists = await Favorite.findOne({ $and: [{ userId: userId }, { pairs: { $in: pair_id } }] })

            if (exists === null) {
                let update = await Favorite.updateOne(
                    { userId: userId },
                    {
                        $push: {
                            pairs: pair_id
                        }
                    },
                    { upsert: true }
                )

                if (update.upsertedCount > 0 || update.modifiedCount > 0) {
                    return res.status(200).json({ success: true, message: "Pair added to favorite list", data: [] })
                } else {
                    return res.status(406).json({ success: false, message: "some error occured while updating coin in favorite", data: [] })
                }
            } else {

                let update = await Favorite.updateOne(
                    { userId: userId },
                    {
                        $pull: {
                            pairs: { $in: [pair_id] },
                        },
                    },
                    { upsert: true }
                )

                if (update.upsertedCount > 0 || update.modifiedCount > 0) {
                    return res.status(200).json({ success: true, message: "Pair removed to favorite list", data: [] })
                } else {
                    return res.status(406).json({ success: false, message: "some error occured while updating coin in favorite", data: [] })
                }
            }

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: [],
            });
        }
    },

    favorite_list: async (req, res) => {
        try {
            const { userId } = req.user

            let data = await Favorite.findOne({ userId: userId });
            if (data) {
                return res.status(200).json({
                    success: true,
                    message: 'favorite list fetched successfully',
                    data: data,
                });
            } else {
                return res.status(200).json({
                    success: true,
                    message: 'favorite list fetched successfully',
                    data: [],
                });
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: [],
            });
        }
    },

    user_refer_code: async (req, res) => {
        try {
            const { userId } = req.user;

            let refer_code = await Referral.findReferralByUserId(userId);
            return res.status(200).json({ success: true, message: "User Refer Code", data: refer_code })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: [],
            });
        }
    },

    total_refer_count: async (req, res) => {
        try {
            const { userId } = req.user;
            //  console.log(total_refer_count,"____________***************8referral count");
            // const userId = "661aace251f551f6b8bda490"
            let user = await Referral.findReferralByUserId(userId);
            if (!user) {
                return res.status(404).json({ success: false, message: "User not found", TotalCount: 0, TotalSHIB: 0 });
            }

            // Get the total_refer count from the user object
            let refer_count = user.total_referred || 0;

            // Round up the refer_count to the nearest multiple of 5000
            const totalSHIB = refer_count * 5000;

            return res.status(200).json({ success: true, message: "User Refer Count", TotalCount: refer_count, TotalSHIB: totalSHIB });
        } catch (error) {

            return res.status(500).json({
                success: false,
                message: error.message,
                data: [],
            });
        }
    },


    referral_user_list: async (req, res) => {
        try {
            const { userId } = req.user;
            let data = await Referral.findReferralByUserId(userId);

            let find_user_code = await Referral.findReferredUserByCode(data.user_code);

            let arr = [];

            for (let i = 0; i < find_user_code.length; i++) {
                let singledetails = await Users.findOne({ _id: find_user_code[i].userId })
                let obj = {
                    email: singledetails.emailId,
                    firstName: singledetails.firstName,
                    lastName: singledetails.lastName,
                    mobile: singledetails.mobileNumber,
                    kycVerified: singledetails.kycVerified,
                    date: singledetails.createdAt
                }

                arr.push(obj);
            }
            return res.status(200).json({ success: true, message: "Referral User List", data: arr })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: [],
            });
        }
    },

    get_logs: async (req, res) => {
        try {
            const { userId } = req.user;
            const { skip, limit } = req.body;

            let logs_data = await logs.find({ userId: userId }).skip(skip || 0).limit(limit || 10).sort({ createdAt: -1 });
            if (logs_data.length > 0 || logs_data) {
                return res.status(200).json({ success: true, message: "Activity logs fetched of user", data: logs_data })
            } else {
                return res.status(500).json({ success: false, message: "Some error occured while fetching logs", data: [] })
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: [],
            });
        }
    },

    forgot_password: async (req, res) => {
        try {
            const { email_or_phone, verification_code, new_password } = req.body;

            let check = await check_type(email_or_phone);
            let user;
            if (check == "email") {
                user = await Users.findOne({ emailId: email_or_phone });
            } else {
                user = await Users.findOne({ mobileNumber: email_or_phone });
            }

            if (user == null) {
                return res.status(404).json({
                    success: false,
                    message: `no user is registered with this ${check}`,
                    data: [],
                });
            }

            let find_otp = await Otps.findOne({ email_or_phone: email_or_phone }).select('otp');


            if (find_otp === null) {
                return res.status(404).json({ success: false, message: 'please send otp first', data: [] })
            } else {
                if (find_otp.otp != verification_code) {
                    return res.status(403).json({ success: false, message: 'verification code not matched', data: [] })
                }
            }

            const password = await Bcrypt.passwordEncryption(new_password);

            let change_password = await Users.updateOne({ _id: user.id },
                { $set: { password: password } },
                { upsert: true })

            if (change_password.upsertedCount > 0 || change_password.modifiedCount > 0) {

                // Add Logs
                let activity_data = {};
                activity_data.Activity = "Password Reset Successfull",
                    activity_data.IP = req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                    activity_data.userId = user._id,
                    activity_data.date = new Date();

                let add_logs = await logs.create(activity_data)


                return res.status(200).json({
                    success: true,
                    message: "Password changed successfully",
                    data: []
                });
            } else {
                return res.status(500).json({
                    success: true,
                    message: "Some error occured please try again later",
                    data: []
                });
            }


        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: [],
            });
        }
    },

    change_password: async (req, res) => {
        try {
            const { userId } = req.user;
            const { old_password, new_password, confirm_password, email_or_phone, verification_code } = req.body;

            let get_user = await Users.findOne({ _id: userId })

            let find_otp = await Otps.findOne({ email_or_phone: email_or_phone }).select('otp');

            if (find_otp === null) {
                return res.status(404).json({ success: false, message: 'please send otp first', data: [] })
            } else {
                if (find_otp.otp != verification_code) {
                    return res.status(403).json({ success: false, message: 'verification code not matched', data: [] })
                }
            }

            let compare = await Bcrypt.passwordComparison(old_password, get_user.password)

            if (compare) {
                const password = await Bcrypt.passwordEncryption(new_password);

                let update_status = await Users.updateOne(
                    { _id: userId },
                    { $set: { password: password } },
                    { upsert: true }
                );


                if (update_status.modifiedCount > 0 || update_status.upsertedCount > 0) {

                    // Add Logs
                    let activity_data = {};
                    activity_data.Activity = "Password Changed",
                        activity_data.IP = req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                        activity_data.userId = userId,
                        activity_data.date = new Date();

                    let add_logs = await logs.create(activity_data)


                    return res.status(200).json({ success: true, message: "Password changed successfully", data: [] })
                } else {
                    return res.status(500).json({ success: false, message: error.message, data: [] })
                }
            } else {
                return res.status(500).json({ success: false, message: "Please enter correct previous password" })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    add_bank_details: async (req, res) => {
        try {
            const { userId } = req.user;
            const { account_type, account_holder_name, account_number, ifsc_code, branch_name, bank_name } = req.body

            let count = await UserBanks.find({ user_id: userId });

            let checkifsc = await ifscValidation(ifsc_code);

            if (count.length > 4) {
                return res.status(406).json({ sucess: false, message: 'You can only add 5 bank details in your account', data: [] })
            }

            let update = await UserBanks.create(
                {
                    type: "BANK",
                    user_id: userId,
                    account_type: account_type,
                    account_holder_name: account_holder_name,
                    account_number: account_number,
                    ifsc_code: ifsc_code,
                    branch_name: branch_name,
                    bank_name: bank_name
                }
            )

            if (update) {
                return res.status(200).json({ sucess: true, message: 'Bank details updated successfully', data: [] })
            } else {
                return res.status(406).json({ sucess: false, message: 'Some error occured while updating bank details', data: [] })
            }

        } catch (error) {
            return res.status(500).json({ sucess: false, message: error.message, data: [] })
        }
    },

    edit_bank_details: async (req, res) => {
        try {
            const { userId } = req.user;
            const { _id, account_type, account_holder_name, account_number, ifsc_code, branch_name, bank_name } = req.body

            let edit = await UserBanks.updateOne(
                { $and: [{ _id: _id }, { user_id: userId }] },
                {
                    $set: {
                        account_type: account_type,
                        account_holder_name: account_holder_name,
                        account_number: account_number,
                        ifsc_code: ifsc_code,
                        branch_name: branch_name,
                        bank_name: bank_name,
                        verified: 0
                    }
                },
                { upsert: true }
            )

            if (edit.upsertedCount > 0 || edit.modifiedCount > 0) {
                return res.status(200).json({ sucess: true, message: 'Bank details updated successfully', data: [] })
            } else {
                return res.status(406).json({ sucess: false, message: 'Some error occured while updating bank details', data: [] })
            }
        } catch (error) {
            return res.status(500).json({ sucess: false, message: error.message, data: [] })
        }
    },

    get_bank_details: async (req, res) => {
        try {
            const { userId } = req.user;

            let details = await UserBanks.find({ user_id: userId })

            if (details != null) {
                return res.status(200).json({ sucess: true, message: 'Bank details fetched successfully', data: details })
            } else {
                return res.status(200).json({ sucess: true, message: 'Bank details fetched successfully', data: [] })
            }

        } catch (error) {
            return res.status(500).json({ sucess: false, message: error.message, data: [] })
        }
    },


    user_upi: async (req, res) => {
        try {
            const { userId } = req.user;
            const { upi_id } = req.body;
            let upi_image;

            let find = await userUpiDetails.findOne({ upi_id: upi_id })

            if (find != null) {
                return res.status(409).json({
                    success: false,
                    message: `User with this upi id is already registered`,
                    data: [],
                });
            }

            let check_upi = await upiValidation(upi_id)

            if (!check_upi) {
                return res.status(200).json({
                    success: false,
                    message: "UPI Id is invalid, Please enter valid UPI Id",
                    data: []
                })
            } else {

                if (req.file != undefined) {
                    upi_image = `uploads/${req.file.filename}`
                }


                let list = {};
                list.type = "UPI"
                list.user_id = userId,
                    list.upi_id = upi_id,
                    list.upi_image = upi_image

                let user_upi = await userUpiDetails.create(list);

                // let user_upi = await userUpiDetails.updateOne({user_id: userId},
                //     {
                //         $set: {
                //             user_id: userId,
                //             upi_image: upi_image
                //         }
                //     }, {upsert: true}
                //     )

                if (user_upi.length > 0 || user_upi) {
                    return res.status(200).json({
                        success: true,
                        message: "UPI Details added successfully",
                        data: user_upi
                    })
                } else {
                    return res.status(200).json({
                        success: false,
                        message: 'Some error occured, Please try again later',
                        data: []
                    })
                }
            }

        } catch (error) {
            return res.status(500)
                .json({
                    success: false,
                    message: error.message,
                    data: []
                })
        }
    },

    edit_upi: async (req, res) => {
        try {
            const { userId } = req.user;
            const { _id, upi_id } = req.body;
            let upi_image;

            let check_upi = await upiValidation(upi_id)

            if (!check_upi) {
                return res.status(200).json({
                    success: false,
                    message: "UPI Id is invalid, Please enter valid UPI Id",
                    data: []
                })
            } else {

                if (req.file != undefined) {
                    upi_image = `uploads/${req.file.filename}`
                }


                let list = {};
                list.user_id = userId,
                    list.upi_id = upi_id,
                    list.upi_image = upi_image


                let user_upi = await userUpiDetails.updateOne({ _id: _id },
                    {
                        $set: {
                            user_id: userId,
                            upi_id: upi_id,
                            upi_image: upi_image,
                            verified: 0
                        }
                    }, { upsert: true }
                )

                if (user_upi.upsertedCount > 0 || user_upi.modifiedCount > 0) {
                    return res.status(200).json({
                        success: true,
                        message: "UPI Details edit successfully",
                        data: user_upi
                    })
                } else {
                    return res.status(200).json({
                        success: false,
                        message: 'Some error occured, Please try again later',
                        data: []
                    })
                }
            }

        } catch (error) {
            return res.status(500)
                .json({
                    success: false,
                    message: error.message,
                    data: []
                })
        }
    },

    delete_upi_id: async (req, res) => {
        try {
            const { _id } = req.body;
            let delete_upi = await userUpiDetails.findByIdAndDelete(_id);
            if (delete_upi) {
                return res.status(200).json({ success: true, message: 'UPI deleted successfully', data: [] })
            } else {
                return res.status(200).json({ success: false, message: 'Some error occured while deleting a sub admin', data: [] })
            }
        } catch (error) {
            return res.status(500).json({ sucess: false, message: error.message, data: [] })
        }
    },

    get_upi_details: async (req, res) => {
        try {
            const { userId } = req.user;
            let bank_details = await userUpiDetails.find({ user_id: userId })

            if (bank_details.length > 0 || bank_details) {
                return res.status(200).json({
                    success: true,
                    message: "UPI Details fetched successfully",
                    data: bank_details
                })
            } else {
                return res.status(500).json({
                    success: false,
                    message: "Some error occured",
                    data: []
                })
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            })
        }
    },


    skip_model: async (req, res) => {
        try {
            const { userId } = req.user;
            const { check } = req.body;
            let update = await Users.updateOne(
                { _id: userId },
                {
                    $set: {
                        buy_sell_model_skip: check
                    }
                },
                { upsert: true }
            )
            if (update.upsertedCount > 0 || update.modifiedCount > 0) {
                return res.status(200).json({ success: true, message: 'Saved Successfully!!', data: [] })
            } else {
                return res.status(406).json({ success: false, message: 'Some error occured', data: [] })
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: [],
            });
        }
    },

    createPartnership: async (req, res) => {
        try {
            const { transactionId, fullName, State, Email, contact } = req.body;

            const PartnershipId = generateRandomString();

            // Assuming 'transactionimage' is the field name for the uploaded image
            const Image = req.file ? req.file.filename : ''; // Check if file is uploaded

            // Create new instance of Partnership model
            const partnership = await Partnership.create({
                transactionId,
                Image,
                fullName,
                State,
                Email,
                contact,
                PartnershipId
            });

            res.status(201).json({
                success: true,
                message: "Partnership created successfully",
                PartnershipID: partnership.PartnershipId // Correct capitalization
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },


    getPartnership: async (req, res) => {
        try {
            let partnershipDetails = await Partnership.find();

            if (partnershipDetails) {
                return res.status(200).json({
                    success: true,
                    message: "Partnership details fetched successfully",
                    data: partnershipDetails
                });
            } else {
                return res.status(404).json({
                    success: false,
                    message: "No partnership details found",
                    data: []
                });
            }
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },


    setStatusPartnership: async (req, res) => {
        try {
            const { partnershipId, status } = req.body;


            const updatedPartnership = await Partnership.findOneAndUpdate(
                { PartnershipId: partnershipId },
                { status: status },
                { new: true }
            );

            if (!updatedPartnership) {
                return res.status(404).json({
                    success: false,
                    message: "Partnership not found"
                });
            }

            return res.status(200).json({
                success: true,
                message: "Partnership status updated successfully",
                data: updatedPartnership
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },


    createCoinListedDetails: async (req, res) => {
        try {
            const { ProjectName, contractAddress, ContactName, countryCode, TelegramID, WhatsappID, PhoneNumber, emailID, referredBy, comments, status } = req.body;

            const existingEntry = await CoinListedDetails.findOne({ ProjectName });

            if (existingEntry) {
                return res.status(400).json({ message: "Entry already exists" });
            }

            const newCoinListedDetails = await CoinListedDetails.create({
                ProjectName,
                contractAddress,
                ContactName,
                TelegramID,
                WhatsappID,
                countryCode,
                PhoneNumber,
                emailID,
                referredBy,
                comments,
                status
            });

            return res.status(200).json({
                success: true,
                message: "Details sent successfully",
                data: newCoinListedDetails
            });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    },

    getcoinListedDetails: async (req, res) => {
        try {
            const totalCount = await CoinListedDetails.countDocuments();
            const data = await CoinListedDetails.aggregate([
                { $addFields: { userObjId: { $toString: "$_id" } } },
                {
                    $lookup: {
                        from: "activitylogs",
                        localField: "userObjId",
                        foreignField: "userId",
                        as: "logs"
                    }
                },
                { $unwind: { path: "$logs", preserveNullAndEmptyArrays: true } },
                { $addFields: { adminObjId: { $toObjectId: "$logs.adminId" } } },
                {
                    $lookup: {
                        from: "admins",
                        let: { adminId: "$adminObjId" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$_id", "$$adminId"] } } },
                            { $project: { email_or_phone: 1 } }
                        ],
                        as: "admin",
                    },
                },
                { $unwind: { path: "$admin", preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: "$_id",
                        ProjectName: { $first: "$ProjectName" },
                        ContactName: { $first: "$ContactName" },
                        contractAddress: { $first: "$contractAddress" },
                        countryCode: { $first: "$countryCode" },
                        TelegramID: { $first: "$TelegramID" },
                        WhatsappID: { $first: "$WhatsappID" },
                        PhoneNumber: { $first: "$PhoneNumber" },
                        emailID: { $first: "$emailID" },
                        referredBy: { $first: "$referredBy" },
                        comments: { $first: "$comments" },
                        status: { $first: "$status" },
                        admin_email: { $first: "$admin.email_or_phone" },
                        admin_id: { $first: "$logs.adminId" },
                        admin_ip: { $first: "$logs.adminIP" },
                        createdAt: { $first: "$createdAt" },
                        updatedAt: { $first: "$updatedAt" }
                    }
                },
            ]).sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                message: "Details fetched successfully",
                data: data,
                totalCount: totalCount
            });
        } catch (error) {
            return res.status(400).json({ message: error.message });
        }
    },

    setcoindetailstatus: async (req, res) => {
        try {
            const adminId = req.user.id;
            const { _id, status } = req.body;

            const data = await CoinListedDetails.findOneAndUpdate(
                { _id: _id },
                { status: status },
                { new: true }
            );

            if (!data) {
                return res.status(404).json({
                    success: false,
                    message: "Data not found"
                });
            }
            // Log activity
            let activity_data = {
                Activity: "Admin Coin Listed Detils Updation",
                adminIP: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                userId: _id,   //here userId will be the projectId of the coin
                adminId: adminId,
                date: new Date()
            };
            let add_logs = await logs.create(activity_data);
            return res.status(200).json({
                success: true,
                message: "Status updated successfully",
                data: data
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message
            });
        }
    },

    referral_balance: async (req, res) => {
        try {
            const { userId } = req.user;
            const usercode = await Referral.findReferralByUserId(userId);
            const allsponser = await Referral.findReferredUserByCode(usercode.user_code);
            const referredUserIds = allsponser.map(user => user.userId);
            const usersWithKyc2 = await Users.find({ _id: { $in: referredUserIds }, kycVerified: 2 });
            const count = usersWithKyc2.length;
            return res.status(200).json({ success: true, message: 'Successfully retrieved referral balance', balance: allsponser.length * 5000 });
        } catch (error) {
            console.error('Error fetching referral balance:', error);
            return res.status(500).json({ success: false, message: 'Internal Server Error', data: null });
        }
    },
    joining_bonus: async (req, res) => {
        try {
            const { userId } = req.user;
            // const userId = "661caceac2273e10842e07d7"; 
            // const usercode = await Referral.findReferralByUserId(userId);
            // if (!usercode.sponser_code) {
            //     return res.status(202).json({ success: true, message: 'User does not have a sponsor code', balance:5000});
            // }

            const user = await Users.findOne({ _id: userId });

            // If the user with the provided ID doesn't exist, return an error response
            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found', data: null });
            }
            else {
                return res.status(200).json({ success: true, message: 'User joining bonus', balance: 5000 });
            }

            // If the user's KYC status is 2, send a response with a joining balance of 5000
            // console.log(user.kycVerified,"***___**__**__");
            // if (user.kycVerified === 2) {
            //     return res.status(200).json({ success: true, message: 'Successfully retrieved joining balance', balance: 5000 });
            // }

            // If the user's KYC status is not 2, send a response indicating the KYC status is not verified
            // return res.status(200).json({ success: false, message: 'KYC status is not verified', balance: 0 });

        } catch (error) {
            console.error('Error in joining bonus:', error);
            return res.status(500).json({ success: false, message: 'Internal Server Error', data: null });
        }
    },
    news_list: async (req, res) => {
        try {
            const apikey = "pub_4935648f47b29295f53eeca085380e9be233e";
            const language = "en";
            const url = `https://newsdata.io/api/1/latest?apikey=${apikey}&language=${language}`;

            let response = await axios.get(url);


            if (response.data && response.data.results) {
                return res.status(200).json({
                    success: true,
                    message: 'News fetched successfully',
                    data: response.data.results,
                });
            } else {
                return res.status(200).json({
                    success: true,
                    message: 'No news data available',
                    data: [],
                });
            }
        } catch (error) {
            console.error('Error fetching news:', error);

            return res.status(500).json({
                success: false,
                message: error.message,
                data: [],
            });
        }
    }

}





