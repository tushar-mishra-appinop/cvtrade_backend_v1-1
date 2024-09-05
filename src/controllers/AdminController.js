const Users = require('../models/Users');
const UserKyc = require('../models/Kyc');
const Bcrypt = require('../utils/Bcrypt')
const Admin = require('../models/Admin');
const Notification = require('../models/Notification');
const Category = require('../models/CoinCategory')
const AdminUpiDetails = require('../models/AdminUpiDetails');
const { upiValidation } = require('../utils/Utils');
const JWT = require("../utils/Jwt");
const { ifscValidation } = require('../utils/IfscValidation');
const AdminBank = require('../models/AdminBank');
const WalletController = require('../controllers/WalletController')
const { updateBalance, update_locked_balance } = require('../controllers/WalletController')
const AdminCommission = require('../models/Commission')
const WalletTransaction = require('../models/WalletTransaction');
const UserBanks = require('../models/UserBankDetails')
const Trades = require('../models/Exchange');
const Wallets = require('../models/Wallets');
const Currency = require('../models/Currency');
const UserBankDetails = require('../models/UserBankDetails');
const userUpiDetails = require('../models/userUpiDetails');
const { email_marketing } = require('../utils/Marketing');
const Otps = require('../models/Otps');
const logs = require('../models/logs');
const Partner = require('../models/partnershipLogin');
const { ObjectId } = require("mongodb");
const { create_wallet_for_partner } = require("./WalletController");

module.exports = {

    login: async (req, res) => {

        const { email_or_phone, password, verification_code } = req.body;

        let admin = await Admin.findOne({ email_or_phone: email_or_phone })
        let exists = await Admin.countDocuments({ email_or_phone: email_or_phone });

        if (exists < 1) {
            return res.status(403).json({ success: false, message: 'Admin with this email id is not exists', data: [] })
        } else {
            let existingWallet = await Wallets.findOne({ user_id: admin._id });
            if (!existingWallet) {
                // Create a wallet for the admin since it doesn't exist
                let adminWallet = await WalletController.admin_wallet(admin._id);
            }

            let find_otp = await Otps.findOne({ email_or_phone: email_or_phone }).select('otp');

            if (find_otp === null) {
                return res.status(404).json({ success: false, message: 'please send otp first', data: [] })
            } else {
                if (find_otp.otp != verification_code) {
                    return res.status(403).json({ success: false, message: 'verification code not matched', data: [] })
                }
            }
            let compare = await Bcrypt.passwordComparison(password, admin.password);

            if (!compare) {
                return res.status(403).json({ success: false, message: 'Password not matched for this account', data: [] })
            } else {

                let response_login = {
                    id: admin._id,
                    email_or_phone: admin.email_or_phone,
                    first_name: admin.first_name,
                    last_name: admin.last_name,
                    admin_type: admin.admin_type,
                    permissions: admin.permissions,
                    joining_date: admin.createdAt
                }

                let jwt_data = response_login;
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
                    name: admin.firstName + ' ' + admin.lastName
                }

                await email_marketing(
                    "login",
                    message,
                    email_or_phone
                );

                // Log activity
                let activity_data = {
                    Activity: "Admin Login",
                    adminIP: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                    adminId: admin.id,
                    date: new Date()
                };

                let add_logs = await logs.create(activity_data);

                return res.status(200).json({
                    success: true,
                    message: "login successful",
                    data: jwt_data,
                });
            }
        }
    },

    add_new_admin: async (req, res) => {
        try {
            const { email_or_phone, first_name, last_name, confirm_password, permissions, admin_type } = req.body;
            let { password } = req.body;
            delete confirm_password;

            let exists = await Admin.countDocuments({ email_or_phone: email_or_phone });
            if (exists > 0) {
                return res.status(403).json({ success: false, message: 'Sub admin with this email id is already exists', data: [] })
            }

            password = await Bcrypt.passwordEncryption(password);
            let create = await Admin.create({ email_or_phone, first_name, last_name, password, permissions, admin_type })
            if (create) {
                return res.status(200).json({ success: true, message: 'Sub admin created successfully', data: [] })
            } else {
                return res.status(200).json({ success: false, message: 'Some error occured while creating a new sub admin', data: [] })
            }

        } catch (error) {
            return res.status(500).json({ success: false, message: 'some error occured on server', data: [] })
        }
    },

    sub_admin_list: async (req, res) => {
        try {
            let list = await Admin.find({ admin_type: { $ne: 1 } });
            if (list.length > 0) {
                return res.status(200).json({ success: true, message: 'Sub admin list fetched successfully', data: list })
            } else {
                return res.status(200).json({ success: true, message: 'Sub admin list fetched successfully', data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    user_list: async (req, res) => {
        try {
            let list = await Users.find().select('_id firstName lastName emailId mobileNumber profilepicture country_code status createdAt kycVerified');
            if (list.length > 0) {
                return res.status(200).json({ success: true, message: 'Trader list fetched successfully', data: list })
            } else {
                return res.status(200).json({ success: true, message: 'Trader list fetched successfully', data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: 'some error occured on server', data: [] })
        }
    },

    get_subadmin_list: async (req, res) => {

        try {

            let subadmin_list = await Admin.find();

            return res.status(200).json({ success: true, message: "Sub Admin list fetched successfully", data: subadmin_list });

        } catch (error) {

            return res.status(500).json({ success: false, message: 'some error occured on server', data: [] })
        }
    },

    user_count: async (req, res) => {
        try {
            let count = await Users.find().count();
            if (count > 0) {
                return res.status(200).json({ success: true, message: 'Trader count fetched successfully', data: count })
            } else {
                return res.status(200).json({ success: true, message: 'Trader count fetched successfully', data: 0 })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: 'some error occured on server', data: [] })
        }
    },

    pending_kyc_count: async (req, res) => {
        try {
            let count = await Users.find({ kycVerified: 1 }).count();
            if (count > 0) {
                return res.status(200).json({ success: true, message: 'Trader with pending kyc count fetched successfully', data: count })
            } else {
                return res.status(200).json({ success: true, message: 'Trader with pending kyc count fetched successfully', data: 0 })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: 'some error occured on server', data: [] })
        }
    },

    approved_kyc_count: async (req, res) => {
        try {
            let count = await Users.find({ kycVerified: 2 }).count();

            if (count > 0) {
                return res.status(200).json({ success: true, message: 'Trader with approved kyc count fetched successfully', data: count })
            } else {
                return res.status(200).json({ success: true, message: 'Trader with approved kyc count fetched successfully', data: 0 })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: 'some error occured on server', data: [] })
        }
    },

    kyc_details: async (req, res) => {
        try {
            const { userId } = req.body;
            let data = await UserKyc.findOne({ userId: userId });
            const userData = await Users.findById(userId)
            let kycVerified = userData.kycVerified;
            let details = { ...data.toObject(), kycVerified };
            if (data) {
                return res.status(200).json({ success: true, message: 'Kyc details fetched successfully', data: details })
            } else {
                return res.status(403).json({ success: true, message: 'Kyc details fetched successfully', data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Kyc details fetched successfully', data: [] })
        }
    },

    update_kyc_status: async (req, res) => {
        try {
            // const adminId  = req.user.id;
            const { userId, status, adminId } = req.body;

            const user = await Users.findById(userId);

            if (!user) {
                return res.status(404).json({ success: false, message: 'User not found', data: [] });
            }

            let update_status = await Users.updateOne(
                { _id: userId },
                { $set: { kycVerified: status } }
            );

            if (status === 2) {
                // const findsponser  = await Referral.findReferralByUserId(userId);

                // if(findsponser){

                // await Wallets.findOneAndUpdate(
                //     { user_id: userId, short_name: "SHIB" },
                //     { $inc: { balance: 5000 } },
                //     { new: true }
                // );
                //  Increment the balance of the sponsor
                //   await Wallets.findOneAndUpdate(
                //     { user_id: findsponser.sponser_id, short_name: "SHIB" },
                //     { $inc: { balance: 5000 } },
                //     { new: true }
                // );

                // Log activity
                let activity_data = {
                    Activity: "Admin KYC Approval",
                    adminIP: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                    adminId: adminId,
                    userId: userId,
                    date: new Date()
                };
                let add_logs = await logs.create(activity_data);


                return res.status(200).json({ success: true, message: 'KYC status updated successfully', data: [] });
                // }else{
                //     return res.status(200).json({ success: true, message: 'KYC status updated successfully', data: [] });
                // }

            } else {
                // Log activity
                let activity_data = {
                    Activity: "Admin KYC Rejection",
                    adminIP: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                    adminId: adminId,
                    userId: userId,
                    date: new Date()
                };
                let add_logs = await logs.create(activity_data);

                return res.status(200).json({ success: true, message: 'KYC Rejected', data: [] });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },

    pending_kyc_user: async (req, res) => {
        try {
            const totalCount = await Users.countDocuments({ kycVerified: 1 });

            let users = await Users.aggregate([
                { $match: { kycVerified: 1 } },
                { $addFields: { userObjId: { $toString: "$_id" } } },
                {
                    $lookup: {
                        from: "userdetails",
                        localField: "userObjId",
                        foreignField: "userId",
                        as: "kycd",
                    },
                },
                { $unwind: { path: "$kycd", preserveNullAndEmptyArrays: true } }, // Ensure documents are not dropped
                {
                    $project: {
                        _id: "$_id",
                        first_name: "$first_name",
                        last_name: "$last_name",
                        emailId: "$emailId",
                        userId: "$kycd.userId",
                        document_number: "$kycd.document_number",
                        pancard_number: "$kycd.pancard_number",
                        dob: '$kycd.dob',
                        user_selfie: '$kycd.user_selfie',
                        createdAt: '$kycd.createdAt'
                    }
                }
            ]).sort({ createdAt: -1 });

            if (users.length > 0) {
                return res.status(200).json({ success: true, message: 'Users with pending KYC fetched', data: users, totalCount: totalCount });
            } else {
                return res.status(200).json({ success: true, message: 'Users with pending KYC fetched', data: [], totalCount: totalCount });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Some error occurred on the server', data: [] });
        }
    },


    //OLD Code
    // pending_kyc_user: async (req, res) => {
    //     try {

    //         const totalCount = await Users.countDocuments({kycVerified : 1});

    //         let user = await Users.aggregate([  
    //             { $match: { kycVerified: 1 } },
    //             { $addFields: { userObjId: { $toString: "$_id" } } },
    //             {
    //                 $lookup: {
    //                     from: "userdetails",
    //                     localField: "userObjId",
    //                     foreignField: "userId",
    //                     as: "kycd",
    //                 },
    //             },
    //             { $unwind: '$kycd' },

    //             {
    //                 $project: {
    //                     first_name: "$first_name",
    //                     last_name: "$last_name",
    //                     emailId: "$emailId",
    //                     userId: "$kycd.userId",
    //                     document_number: "$kycd.document_number",
    //                     pancard_number: "$kycd.pancard_number",
    //                     dob: '$kycd.dob',
    //                     user_selfie: '$kycd.user_selfie',
    //                     createdAt: '$kycd.createdAt'
    //                 }
    //             }
    //         ]).sort({createdAt : -1})
    //         if (user.length > 0) {
    //             return res.status(200).json({ success: true, message: 'Users with pending kyc fetched', data: user, totalCount : totalCount })
    //         } else {
    //             return res.status(200).json({ success: true, message: 'Users with pending kyc fetched', data: [], totalCount : totalCount })
    //         }
    //     } catch (error) {
    //         return res.status(500).json({ success: false, message: 'some error occured on server', data: [] })
    //     }
    // },

    //OLD Code
    // approve_kyc_user: async (req, res) => {
    //     try {
    //         const totalCount = await Users.countDocuments({kycVerified : 2});

    //         let users = await Users.aggregate([
    //             { $match: { kycVerified: 2 } },
    //             { $addFields: { userObjId: { $toString: "$_id" } } },

    //             {
    //                 $lookup: {
    //                     from: "userdetails",
    //                     localField: "userObjId",
    //                     foreignField: "userId",
    //                     as: "kycd",
    //                 },
    //             },
    //             { $unwind: '$kycd' },
    //             {
    //                 $lookup: {
    //                     from: "activitylogs",
    //                     localField: "userObjId",
    //                     foreignField: "userId",
    //                     as: "logs",
    //                 },
    //             },
    //             { $unwind: '$logs' },
    //             { $addFields: { adminObjId: { $toObjectId: "$logs.adminId" } } },
    //             {
    //                 $lookup: {
    //                     from: "admins",
    //                     let: { adminId: "$adminObjId" },
    //                     pipeline: [
    //                         { $match: { $expr: { $eq: ["$_id", "$$adminId"] } } },
    //                         { $project: { email_or_phone: 1 } }  
    //                     ],
    //                     as: "admin",
    //                 },
    //             },
    //             {
    //                 $unwind: {
    //                     path: "$admin",
    //                     preserveNullAndEmptyArrays: true  
    //                 }
    //             },
    //             // {
    //             //     $sort: {
    //             //         "logs.createdAt": -1
    //             //     }
    //             // },

    //             {
    //                 $group: {
    //                     _id: "$_id",
    //                     first_name: { $first: "$first_name" },
    //                     last_name: { $first: "$last_name" },
    //                     emailId: { $first: "$emailId" },
    //                     userId: { $first: "$kycd.userId" },
    //                     document_number: { $first: "$kycd.document_number" },
    //                     pancard_number: { $first: "$kycd.pancard_number" },
    //                     dob: { $first: '$kycd.dob' },
    //                     admin_email: { $first: "$admin.email_or_phone" },
    //                     admin_id: { $first: "$logs.adminId" },
    //                     admin_ip: { $first: "$logs.adminIP" },
    //                     user_selfie: { $first: '$kycd.user_selfie' },
    //                     createdAt: { $first: '$kycd.createdAt' }
    //                 }
    //             },
    //         ]).sort({createdAt : -1});

    //         if (users.length > 0) {
    //             return res.status(200).json({ success: true, message: 'Users with Kyc success fetched', data: users, totalCount : totalCount  })
    //         } else {
    //             return res.status(200).json({ success: true, message: 'Users with pending kyc fetched', data: [], totalCount : totalCount })
    //         }
    //     } catch (error) {
    //         return res.status(500).json({ success: false, message: 'Some error occurred on the server', data: [] })
    //     }
    // },

    approve_kyc_user: async (req, res) => {
        try {
            const totalCount = await Users.countDocuments({ kycVerified: 2 });

            let users = await Users.aggregate([
                { $match: { kycVerified: 2 } },
                { $addFields: { userObjId: { $toString: "$_id" } } },
                {
                    $lookup: {
                        from: "userdetails",
                        localField: "userObjId",
                        foreignField: "userId",
                        as: "kycd",
                    },
                },
                { $unwind: { path: "$kycd", preserveNullAndEmptyArrays: true } }, // Ensure documents are not dropped
                {
                    $lookup: {
                        from: "activitylogs",
                        localField: "userObjId",
                        foreignField: "userId",
                        as: "logs",
                    },
                },
                { $unwind: { path: "$logs", preserveNullAndEmptyArrays: true } }, // Ensure documents are not dropped
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
                { $unwind: { path: "$admin", preserveNullAndEmptyArrays: true } }, // Ensure documents are not dropped
                {
                    $group: {
                        _id: "$_id",
                        first_name: { $first: "$first_name" },
                        last_name: { $first: "$last_name" },
                        emailId: { $first: "$emailId" },
                        userId: { $first: "$kycd.userId" },
                        document_number: { $first: "$kycd.document_number" },
                        pancard_number: { $first: "$kycd.pancard_number" },
                        dob: { $first: '$kycd.dob' },
                        admin_email: { $first: "$admin.email_or_phone" },
                        admin_id: { $first: "$logs.adminId" },
                        admin_ip: { $first: "$logs.adminIP" },
                        user_selfie: { $first: '$kycd.user_selfie' },
                        createdAt: { $first: '$kycd.createdAt' }
                    }
                },
            ]).sort({ createdAt: -1 });

            if (users.length > 0) {
                return res.status(200).json({ success: true, message: 'Users with KYC success fetched', data: users, totalCount: totalCount });
            } else {
                return res.status(200).json({ success: true, message: 'Users with pending KYC fetched', data: [], totalCount: totalCount });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Some error occurred on the server', data: [] });
        }
    },

    rejected_kyc_user: async (req, res) => {
        try {
            const totalCount = await Users.countDocuments({ kycVerified: 3 });

            let users = await Users.aggregate([
                { $match: { kycVerified: 3 } },
                { $addFields: { userObjId: { $toString: "$_id" } } },
                {
                    $lookup: {
                        from: "userdetails",
                        localField: "userObjId",
                        foreignField: "userId",
                        as: "kycd",
                    },
                },
                { $unwind: { path: "$kycd", preserveNullAndEmptyArrays: true } }, // Ensure documents are not dropped
                {
                    $lookup: {
                        from: "activitylogs",
                        localField: "userObjId",
                        foreignField: "userId",
                        as: "logs",
                    },
                },
                { $unwind: { path: "$logs", preserveNullAndEmptyArrays: true } }, // Ensure documents are not dropped
                { $addFields: { adminObjId: { $toObjectId: "$logs.adminId" } } },
                {
                    $lookup: {
                        from: "admins",
                        let: { adminId: "$adminObjId" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$_id", "$$adminId"] } } },
                            { $project: { email_or_phone: 1 } }  // Only include the necessary fields
                        ],
                        as: "admin",
                    },
                },
                {
                    $unwind: {
                        path: "$admin",
                        preserveNullAndEmptyArrays: true  // Ensure documents without matching admin are included
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        first_name: { $first: "$first_name" },
                        last_name: { $first: "$last_name" },
                        emailId: { $first: "$emailId" },
                        userId: { $first: "$kycd.userId" },
                        document_number: { $first: "$kycd.document_number" },
                        pancard_number: { $first: "$kycd.pancard_number" },
                        dob: { $first: '$kycd.dob' },
                        admin_email: { $first: "$admin.email_or_phone" },
                        admin_id: { $first: "$logs.adminId" },
                        admin_ip: { $first: "$logs.adminIP" },
                        user_selfie: { $first: '$kycd.user_selfie' },
                        createdAt: { $first: '$kycd.createdAt' }
                    }
                }
            ]).sort({ createdAt: -1 });

            if (users.length > 0) {
                return res.status(200).json({ success: true, message: 'Users with rejected KYC fetched', data: users, totalCount: totalCount });
            } else {
                return res.status(200).json({ success: true, message: 'Users with rejected KYC fetched', data: [], totalCount: totalCount });
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: 'Some error occurred on the server', data: [] });
        }
    },


    //OLD Code
    // rejected_kyc_user: async (req, res) => {
    //     try {
    //         const totalCount = await Users.countDocuments({kycVerified : 3});

    //         let user = await Users.aggregate([
    //             { $match: { kycVerified: 3 } },
    //             { $addFields: { userObjId: { $toString: "$_id" } } },
    //             {
    //                 $lookup: {
    //                     from: "userdetails",
    //                     localField: "userObjId",
    //                     foreignField: "userId",
    //                     as: "kycd",
    //                 },
    //             },
    //             { $unwind: '$kycd' },
    //             {
    //                 $lookup: {
    //                     from: "activitylogs",
    //                     localField: "userObjId",
    //                     foreignField: "userId",
    //                     as: "logs",
    //                 },
    //             },
    //             { $unwind: '$logs' },
    //             { $addFields: { adminObjId: { $toObjectId: "$logs.adminId" } } },
    //             {
    //                 $lookup: {
    //                     from: "admins",
    //                     let: { adminId: "$adminObjId" },
    //                     pipeline: [
    //                         { $match: { $expr: { $eq: ["$_id", "$$adminId"] } } },
    //                         { $project: { email_or_phone: 1 } }  // Only include the necessary fields
    //                     ],
    //                     as: "admin",
    //                 },
    //             },
    //             {
    //                 $unwind: {
    //                     path: "$admin",
    //                     preserveNullAndEmptyArrays: true  // Ensure documents without matching admin are included
    //                 }
    //             },

    //             // {
    //             //     $sort: {
    //             //         "logs.createdAt": -1
    //             //     }
    //             // },

    //             {
    //                 $group: {
    //                     _id: "$_id",
    //                     first_name: { $first: "$first_name" },
    //                     last_name: { $first: "$last_name" },
    //                     emailId: { $first: "$emailId" },
    //                     userId: { $first: "$kycd.userId" },
    //                     document_number: { $first: "$kycd.document_number" },
    //                     pancard_number: { $first: "$kycd.pancard_number" },
    //                     dob: { $first: '$kycd.dob' },
    //                     admin_email: { $first: "$admin.email_or_phone" },
    //                     admin_id: { $first: "$logs.adminId" },
    //                     admin_ip: { $first: "$logs.adminIP" },
    //                     user_selfie: { $first: '$kycd.user_selfie' },
    //                     createdAt: { $first: '$kycd.createdAt' }
    //                 }
    //             }
    //         ]).sort({createdAt : -1});

    //         if (user.length > 0) {
    //             return res.status(200).json({ success: true, message: 'Users with rejected kyc fetched', data: user, totalCount : totalCount })
    //         } else {
    //             return res.status(200).json({ success: true, message: 'Users with rejected kyc fetched', data: [], totalCount : totalCount })
    //         }
    //     } catch (error) {
    //         return res.status(500).json({ success: false, message: 'some error occured on server', data: [] })
    //     }
    // },

    create_coin_category: async (req, res) => {
        try {
            const { name } = req.body;
            let exists = await Category.findOne({ category: name });
            if (exists != null) {
                return res.status(406).json({ success: false, message: 'you have already created this coin category', data: [] })
            } else {
                let create = await Category.create({ category: name });
                if (create) {
                    return res.status(200).json({ success: true, message: 'coin category created Successfully', data: create })
                } else {
                    return res.status(406).json({ success: false, message: 'some error occured while create the coin category', data: [] })
                }
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    get_coin_category_list: async (req, res) => {
        try {
            let list = await Category.find();
            if (list.length > 0) {
                return res.status(200).json({ success: true, message: 'coin category list fetched', data: list })
            } else {
                return res.status(200).json({ success: true, message: 'coin category list fetched', data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    today_new_registration: async (req, res) => {
        try {

            let queryObj = {};
            const startOfDay = new Date(
                new Date().setUTCHours(0, 0, 0, 0)
            ).toISOString();

            const endOfDay = new Date(
                new Date().setUTCHours(23, 59, 59, 999)
            ).toISOString();

            queryObj.createdAt = {
                $gte: startOfDay,
                $lt: endOfDay,
            };

            const count = await Users.find(queryObj).count()
            const data2 = await Users.find(queryObj);

            if (count || count.length > 0) {

                return res.status(200).json({ success: true, message: 'New Registration Fetched successfully', data: count, data: data2 })
            } else {
                return res.status(200).json({ success: true, message: 'New Registration Fetched successfully', data: count, data: data2 })
                // return { count: 0, data2: [] }
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },


    edit_subadmin_details: async (req, res) => {
        try {
            const { id, email_or_phone, first_name, last_name, permissions, admin_type } = req.body;

            let update_data = await Admin.updateOne(
                { _id: id },
                {
                    $set: {
                        email_or_phone: email_or_phone,
                        first_name: first_name,
                        last_name: last_name,
                        permissions: permissions,
                        admin_type: admin_type,
                    }
                }
            )
            if (update_data) {
                return res.status(200).json({ success: true, message: 'Sub admin updatted successfully', data: [] })
            } else {
                return res.status(200).json({ success: false, message: 'Some error occured while updating sub admin', data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: 'some error occured on server', data: [] })
        }
    },

    delete_subadmin: async (req, res) => {
        try {
            const { _id } = req.body;
            let delete_subadmin = await Admin.findByIdAndDelete(_id);
            if (delete_subadmin) {
                return res.status(200).json({ success: true, message: 'Sub admin deleted successfully', data: [] })
            } else {
                return res.status(200).json({ success: false, message: 'Some error occured while deleting a sub admin', data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: 'some error occured on server', data: [] })
        }
    },

    update_status: async (req, res) => {
        try {
            const { _id, status } = req.body;

            let update_status = await Users.updateOne(
                { _id: _id },
                {
                    $set: {
                        status: status
                    }
                },
                { upsert: true }
            )
            if (update_status.modifiedCount > 0 || update_status.upsertedCount > 0) {
                return res.status(200).json({ success: true, message: "Status updated successfully", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    admin_status: async (req, res) => {
        try {
            const { _id, status } = req.body;

            let update_status = await Admin.updateOne(
                { _id: _id },
                {
                    $set: {
                        status: status
                    }
                },
                { upsert: true }
            )
            if (update_status.modifiedCount > 0 || update_status.upsertedCount > 0) {
                return res.status(200).json({ success: true, message: "Status updated successfully", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    add_notification: async (req, res) => {
        try {
            const { title, message } = req.body;
            let add_notification = await Notification.create(req.body)
            return res.status(200).json({ success: true, message: "Notification Sent Successfully!", data: add_notification })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    notification_list: async (req, res) => {
        try {
            let notification_list = await Notification.find()
            return res.status(200).json({ success: true, message: "Notification List Fetched", data: notification_list })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    delete_notification: async (req, res) => {
        try {
            const { _id } = req.body;

            let delete_notification = await Notification.findByIdAndDelete({ _id })

            return res.status(200).json({ success: true, message: "Notification Deleted Successfully", data: delete_notification })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })

        }
    },

    admin_bank_details: async (req, res) => {
        try {
            const { bank_name, account_number, holder_name, ifsc, branch } = req.body;
            await ifscValidation(ifsc)

            let add_details = await AdminBank.updateOne({ account_number: account_number },
                {
                    $set: {
                        bank_name: bank_name,
                        account_number: account_number,
                        holder_name: holder_name,
                        ifsc: ifsc,
                        branch: branch
                    }
                },
                { upsert: true }
            )
            return res.status(200).json({
                success: true,
                message: 'Bank Details added successfully!',
                data: add_details
            })
        } catch (error) {
            return res.status(500)
                .json({
                    success: false,
                    message: error.message,
                    data: []
                })
        }
    },

    get_bank_details: async (req, res) => {
        try {
            let bank_details = await AdminBank.find()
            return res.status(200).json({
                success: true,
                message: "Bank Details fetched successfully",
                data: bank_details
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            })
        }
    },

    get_user_bank_details: async (req, res) => {
        try {
            const { userId } = req.body;

            let bank_details = await UserBankDetails.find({ user_id: userId });
            return res.status(200).json({
                success: true,
                message: "Bank Details fetched successfully",
                data: bank_details
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            })
        }
    },


    select_given_coin: async (req, res) => {
        try {
            const { coinName } = req.body;

            let data = await Wallets.aggregate([
                { $addFields: { userObjId: { $toObjectId: '$user_id' } } },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'userObjId',
                        foreignField: '_id',
                        as: 'logindata'
                    }
                },
                {
                    $unwind: '$logindata'
                },
                { $match: { "short_name": coinName } },
                {
                    $project: {
                        firstName: '$logindata.firstName',
                        lastName: '$logindata.lastName',
                        emailId: '$logindata.emailId',
                        userId: '$user_id',
                        balance: '$balance',
                        locked_balance: '$locked_balance',
                        currency_id: '$currency_id',
                        currency: '$currency',
                        short_name: '$short_name'
                    }
                },
            ]);



            return res.status(200).json({
                success: true,
                message: 'Coin Selected',
                data: data
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            })
        }
    },

    debit_credit: async (req, res) => {
        try {
            const { userId, coinId, type, amount, account_type } = req.body;
            if (type == 'DEBIT') {
                let wallet_balance = await Wallets.findOne({ user_id: userId, currency_id: coinId })
                if (wallet_balance.balance < amount) {
                    return res.status(200).json({
                        success: false,
                        message: "Insufficient Balance",
                        data: []
                    })
                }
                await WalletController.updateBalance(userId, coinId, -amount, account_type)

                let trans = {}
                trans.user_id = userId;
                trans.transaction_type = "DEBIT"
                trans.amount = amount
                trans.currency_id = coinId
                trans.description = `DEBIT BY ADMIN FROM ${account_type === "locked_balance" ? "LOCKED BALANCE" : "BALANCE"}`
                trans.currency = wallet_balance.currency
                trans.short_name = wallet_balance.short_name
                trans.chain = wallet_balance.chain[0]
                trans.status = "COMPLETED"

                await WalletTransaction.create(trans);
            } else if (type == 'CREDIT') {
                let wallet_balance = await Wallets.findOne({ user_id: userId, currency_id: coinId })

                await WalletController.updateBalance(userId, coinId, amount, account_type)

                let trans = {}
                trans.user_id = userId;
                trans.transaction_type = "CREDIT"
                trans.amount = amount
                trans.currency_id = coinId
                trans.description = `CREDIT BY ADMIN IN ${account_type === "locked_balance" ? "LOCKED BALANCE" : "BALANCE"}`
                trans.currency = wallet_balance.currency
                trans.short_name = wallet_balance.short_name
                trans.chain = wallet_balance.chain[0]
                trans.status = "COMPLETED"

                await WalletTransaction.create(trans);
            }
            return res.status(200).json({ success: true, message: "Debit or Credit done suceessfully", data: [] })
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message, data: [] });
        }
    },

    get_debit_credit_transaction: async (req, res) => {
        try {
            const { userId } = req.body;
            let data = await WalletTransaction.find({
                $and: [
                    { $or: [{ transaction_type: "DEBIT" }, { transaction_type: "CREDIT" },] },
                    { user_id: userId }
                ]
            });
            return res.status(200).json({ success: true, message: "Debit and Credit Transactions Fetched successfully", data: data })
        } catch (error) {
            return res.status(500).json({ success: false, error: error.message, data: [] });
        }
    },

    pending_deposit_request: async (req, res) => {
        try {
            const totalCount = await WalletTransaction.countDocuments({ transaction_type: "DEPOSIT", status: "PENDING" });

            let deposit_data = await WalletTransaction.aggregate([
                { $match: { transaction_type: "DEPOSIT", status: "PENDING" } },
                { $addFields: { userObjId: { $toObjectId: "$user_id" } } },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'userObjId',
                        foreignField: '_id',
                        as: 'logindata'
                    },
                },
                { $unwind: { path: '$logindata', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: "$_id",
                        user_id: { $first: "$user_id" },
                        currency: { $first: "$currency" },
                        currency_id: { $first: "$currency_id" },
                        chain: { $first: "$chain" },
                        short_name: { $first: "$short_name" },
                        description: { $first: "$description" },
                        amount: { $first: "$amount" },
                        transaction_type: { $first: "$transaction_type" },
                        transaction_hash: { $first: "$transaction_hash" },
                        fee: { $first: "$fee" },
                        status: { $first: "$status" },
                        from_address: { $first: "$from_address" },
                        payment_type: { $first: "$payment_type" },
                        to_address: { $first: "$to_address" },
                        createdAt: { $first: "$createdAt" },
                        updatedAt: { $first: "$updatedAt" },
                        userObjId: { $first: "$userObjId" },
                        firstName: { $first: "$logindata.firstName" },
                        lastName: { $first: "$logindata.lastName" },
                        emailId: { $first: "$logindata.emailId" },
                        mobileNumber: { $first: "$logindata.mobileNumber" }
                    }
                },
                { $sort: { createdAt: -1 } }
            ]);

            return res.status(200).json({
                success: true,
                message: 'Pending Deposit List',
                data: deposit_data,
                totalCount: totalCount
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },

    complete_deposit_request: async (req, res) => {
        try {
            const totalCount = await WalletTransaction.countDocuments({ transaction_type: "DEPOSIT", status: "SUCCESS" });

            let deposit_data = await WalletTransaction.aggregate([
                { $match: { transaction_type: "DEPOSIT", status: "SUCCESS" } },
                { $addFields: { userObjId: { $toObjectId: "$user_id" } } },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'userObjId',
                        foreignField: '_id',
                        as: 'logindata'
                    },
                },
                { $unwind: { path: '$logindata', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: "$_id",
                        user_id: { $first: "$user_id" },
                        currency: { $first: "$currency" },
                        currency_id: { $first: "$currency_id" },
                        chain: { $first: "$chain" },
                        short_name: { $first: "$short_name" },
                        description: { $first: "$description" },
                        amount: { $first: "$amount" },
                        transaction_type: { $first: "$transaction_type" },
                        transaction_hash: { $first: "$transaction_hash" },
                        fee: { $first: "$fee" },
                        status: { $first: "$status" },
                        from_address: { $first: "$from_address" },
                        payment_type: { $first: "$payment_type" },
                        to_address: { $first: "$to_address" },
                        createdAt: { $first: "$createdAt" },
                        updatedAt: { $first: "$updatedAt" },
                        userObjId: { $first: "$userObjId" },
                        firstName: { $first: "$logindata.firstName" },
                        lastName: { $first: "$logindata.lastName" },
                        emailId: { $first: "$logindata.emailId" },
                        mobileNumber: { $first: "$logindata.mobileNumber" }
                    }
                },
                { $sort: { createdAt: -1 } }
            ]);

            return res.status(200).json({
                success: true,
                message: 'Completed Deposit List',
                data: deposit_data,
                totalCount: totalCount
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },


    pending_withdraw_request: async (req, res) => {
        try {
            const totalCount = await WalletTransaction.countDocuments({ transaction_type: "WITHDRAWAL", status: "PENDING" });

            let deposit_data = await WalletTransaction.aggregate([
                { $match: { transaction_type: "WITHDRAWAL", status: "PENDING" } },
                { $addFields: { userObjId: { $toObjectId: "$user_id" } } },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'userObjId',
                        foreignField: '_id',
                        as: 'logindata'
                    },
                },
                { $unwind: { path: '$logindata', preserveNullAndEmptyArrays: true } }, // Ensure documents are not dropped
                {
                    $addFields: {
                        firstName: '$logindata.firstName',
                        lastName: '$logindata.lastName',
                        emailId: "$logindata.emailId",
                        mobileNumber: "$logindata.mobileNumber"
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        transaction_type: { $first: "$transaction_type" },
                        currency: { $first: "$currency" },
                        currency_id: { $first: "$currency_id" },
                        chain: { $first: "$chain" },
                        short_name: { $first: "$short_name" },
                        description: { $first: "$description" },
                        amount: { $first: "$amount" },
                        fee: { $first: "$fee" },
                        from_address: { $first: "$from_address" },
                        to_address: { $first: "$to_address" },
                        payment_type: { $first: "$payment_type" },
                        status: { $first: "$status" },
                        user_id: { $first: "$user_id" },
                        createdAt: { $first: "$createdAt" },
                        updatedAt: { $first: "$updatedAt" },
                        firstName: { $first: "$firstName" },
                        lastName: { $first: "$lastName" },
                        emailId: { $first: "$emailId" },
                        mobileNumber: { $first: "$mobileNumber" }
                    }
                },
                { $sort: { createdAt: -1 } }
            ]);

            return res.status(200).json({
                success: true,
                message: 'Pending Withdrawal List',
                data: deposit_data,
                totalCount: totalCount
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },

    complete_withdraw_request: async (req, res) => {
        try {
            const totalCount = await WalletTransaction.countDocuments({ transaction_type: "WITHDRAWAL", status: "COMPLETE" });

            let deposit_data = await WalletTransaction.aggregate([
                { $match: { transaction_type: "WITHDRAWAL", status: "COMPLETE", transaction_hash: { $ne: 'Internal error' } } },
                { $addFields: { userObjId: { $toObjectId: "$user_id" } } },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'userObjId',
                        foreignField: '_id',
                        as: 'logindata'
                    },
                },
                { $unwind: { path: '$logindata', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "activitylogs",
                        localField: "user_id",
                        foreignField: "userId",
                        as: "logs",
                    },
                },
                { $unwind: { path: '$logs', preserveNullAndEmptyArrays: true } },
                { $addFields: { adminObjId: { $toObjectId: "$logs.adminId" } } },
                {
                    $lookup: {
                        from: "admins",
                        let: { adminId: "$adminObjId" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$_id", "$$adminId"] } } },
                            { $project: { email_or_phone: 1 } }  // Only include the necessary fields
                        ],
                        as: "admin",
                    },
                },
                {
                    $unwind: {
                        path: "$admin",
                        preserveNullAndEmptyArrays: true  // Ensure documents without matching admin are included
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        user_id: { $first: "$user_id" },
                        currency: { $first: "$currency" },
                        currency_id: { $first: "$currency_id" },
                        chain: { $first: "$chain" },
                        short_name: { $first: "$short_name" },
                        description: { $first: "$description" },
                        amount: { $first: "$amount" },
                        transaction_type: { $first: "$transaction_type" },
                        transaction_hash: { $first: "$transaction_hash" },
                        fee: { $first: "$fee" },
                        status: { $first: "$status" },
                        from_address: { $first: "$from_address" },
                        payment_type: { $first: "$payment_type" },
                        to_address: { $first: "$to_address" },
                        createdAt: { $first: "$createdAt" },
                        updatedAt: { $first: "$updatedAt" },
                        userObjId: { $first: "$userObjId" },
                        firstName: { $first: "$logindata.firstName" },
                        lastName: { $first: "$logindata.lastName" },
                        emailId: { $first: "$logindata.emailId" },
                        mobileNumber: { $first: "$logindata.mobileNumber" },
                        admin_email: { $first: "$admin.email_or_phone" },
                        admin_id: { $first: "$logs.adminId" },
                        admin_ip: { $first: "$logs.adminIP" }
                    }
                }
            ]).sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                message: 'Complete Withdrawal List',
                data: deposit_data,
                totalCount: totalCount
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },


    withdrawal_fees: async (req, res) => {
        try {
            let deposit_data = await WalletTransaction.aggregate([
                { $match: { transaction_type: "WITHDRAWAL", status: "COMPLETE", transaction_hash: { $ne: 'Intranal error' } } },
                { $addFields: { userObjId: { $toObjectId: "$user_id" } } },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'userObjId',
                        foreignField: '_id',
                        as: 'logindata'
                    },
                },
                { $unwind: '$logindata' },
                {
                    $addFields: {
                        firstName: '$logindata.firstName',
                        lastName: '$logindata.lastName',
                        emailId: "$logindata.emailId",
                        mobileNumber: "$logindata.mobileNumber"
                    }
                },
                { $project: { 'logindata': 0 } }
            ]).select('createdAt short_name emailId fee amount chain order_id user_id')

            let total = 0
            for (let i = 0; i < deposit_data.length; i++) {
                total += deposit_data[i].fee
            }
            return res.status(200).json({
                success: true,
                message: 'Withdrawal Fees Fetched Successfully',
                data: {
                    list: deposit_data,
                    total_fee: total
                }
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            })
        }
    },

    miscellaneous_withdraw_request: async (req, res) => {
        try {
            let deposit_data = await WalletTransaction.aggregate([
                { $match: { transaction_type: "WITHDRAWAL", status: "COMPLETE", transaction_hash: 'Internal error' } },
                { $addFields: { userObjId: { $toObjectId: "$user_id" } } },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'userObjId',
                        foreignField: '_id',
                        as: 'logindata'
                    },
                },
                { $unwind: { path: '$logindata', preserveNullAndEmptyArrays: true } },
                {
                    $group: {
                        _id: "$_id",
                        user_id: { $first: "$user_id" },
                        currency: { $first: "$currency" },
                        currency_id: { $first: "$currency_id" },
                        chain: { $first: "$chain" },
                        short_name: { $first: "$short_name" },
                        description: { $first: "$description" },
                        amount: { $first: "$amount" },
                        transaction_type: { $first: "$transaction_type" },
                        transaction_hash: { $first: "$transaction_hash" },
                        fee: { $first: "$fee" },
                        status: { $first: "$status" },
                        from_address: { $first: "$from_address" },
                        payment_type: { $first: "$payment_type" },
                        to_address: { $first: "$to_address" },
                        createdAt: { $first: "$createdAt" },
                        updatedAt: { $first: "$updatedAt" },
                        userObjId: { $first: "$userObjId" },
                        firstName: { $first: "$logindata.firstName" },
                        lastName: { $first: "$logindata.lastName" },
                        emailId: { $first: "$logindata.emailId" },
                        mobileNumber: { $first: "$logindata.mobileNumber" }
                    }
                },
                { $sort: { createdAt: -1 } }
            ]);

            return res.status(200).json({
                success: true,
                message: 'Miscellaneous Withdrawal List',
                data: deposit_data
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },

    cancelled_withdraw_request: async (req, res) => {
        try {
            const totalCount = await WalletTransaction.countDocuments({ transaction_type: "WITHDRAWAL", status: "REJECTED" });

            let deposit_data = await WalletTransaction.aggregate([
                { $match: { transaction_type: "WITHDRAWAL", status: "REJECTED" } },
                { $addFields: { userObjId: { $toObjectId: "$user_id" } } },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'userObjId',
                        foreignField: '_id',
                        as: 'logindata'
                    },
                },
                { $unwind: { path: '$logindata', preserveNullAndEmptyArrays: true } },
                {
                    $lookup: {
                        from: "activitylogs",
                        localField: "user_id",
                        foreignField: "userId",
                        as: "logs",
                    },
                },
                { $unwind: { path: '$logs', preserveNullAndEmptyArrays: true } },
                { $addFields: { adminObjId: { $toObjectId: "$logs.adminId" } } },
                {
                    $lookup: {
                        from: "admins",
                        let: { adminId: "$adminObjId" },
                        pipeline: [
                            { $match: { $expr: { $eq: ["$_id", "$$adminId"] } } },
                            { $project: { email_or_phone: 1 } }  // Only include the necessary fields
                        ],
                        as: "admin",
                    },
                },
                {
                    $unwind: {
                        path: "$admin",
                        preserveNullAndEmptyArrays: true  // Ensure documents without matching admin are included
                    }
                },
                {
                    $group: {
                        _id: "$_id",
                        user_id: { $first: "$user_id" },
                        currency: { $first: "$currency" },
                        currency_id: { $first: "$currency_id" },
                        chain: { $first: "$chain" },
                        short_name: { $first: "$short_name" },
                        description: { $first: "$description" },
                        amount: { $first: "$amount" },
                        transaction_type: { $first: "$transaction_type" },
                        fee: { $first: "$fee" },
                        status: { $first: "$status" },
                        from_address: { $first: "$from_address" },
                        payment_type: { $first: "$payment_type" },
                        to_address: { $first: "$to_address" },
                        createdAt: { $first: "$createdAt" },
                        updatedAt: { $first: "$updatedAt" },
                        userObjId: { $first: "$userObjId" },
                        firstName: { $first: "$logindata.firstName" },
                        lastName: { $first: "$logindata.lastName" },
                        emailId: { $first: "$logindata.emailId" },
                        mobileNumber: { $first: "$logindata.mobileNumber" },
                        admin_email: { $first: "$admin.email_or_phone" },
                        admin_id: { $first: "$logs.adminId" },
                        admin_ip: { $first: "$logs.adminIP" }
                    }
                }
            ]).sort({ createdAt: -1 });

            return res.status(200).json({
                success: true,
                message: 'Cancelled Withdrawal List',
                data: deposit_data,
                totalCount: totalCount
            });
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },


    update_deposit_status: async (req, res) => {
        try {
            const { _id, status } = req.body;

            let find_deposit_transaction = await WalletTransaction.findOne({
                $and: [{ _id: _id, transaction_type: "DEPOSIT" }]
            })

            if (!find_deposit_transaction) {
                return res.status(500)
                    .json({
                        success: false,
                        message: "No Transaction found with this ID",
                        data: []
                    })
            }
            if (find_deposit_transaction.status != 'PENDING') {
                return res.status(500)
                    .json({
                        success: false,
                        message: "Transaction status already completed"
                    })
            }
            if (status == 'CANCELLED') {

                await WalletController.update_locked_balance(
                    find_deposit_transaction.user_id,
                    find_deposit_transaction.currency_id,
                    -find_deposit_transaction.amount
                )

            } else {

                await WalletController.update_locked_balance(
                    find_deposit_transaction.user_id,
                    find_deposit_transaction.currency_id,
                    -find_deposit_transaction.amount
                )

                await WalletController.updateBalance(find_deposit_transaction.user_id,
                    find_deposit_transaction.currency_id,
                    find_deposit_transaction.amount
                )
            }
            let details = await WalletTransaction.updateOne(
                { _id: _id },
                {
                    $set: { status: status }
                },
                { upsert: true }
            )

            return res.status(200)
                .json({
                    success: true,
                    message: 'Deposit Status Updatted',
                    data: details
                })
        } catch (error) {
            return res.status(500)
                .json({
                    success: false,
                    message: error.message,
                    data: []
                })
        }
    },

    update_withdrawal_status: async (req, res) => {
        try {
            // const adminId = req.user.id;
            // REJECTED, COMPLETED
            const { _id, status, transaction_hash, adminId } = req.body;


            let find_withdrawal_transaction = await WalletTransaction.findOne({
                $and: [{ _id: _id, transaction_type: "WITHDRAWAL" }]
            })
            const user_data = await Users.findOne({ _id: find_withdrawal_transaction.user_id });
            // const curr = await Currency.findOne({currency_id:find_withdrawal_transaction.currency_id});
            // const fee = curr.transaction_fee
            if (!find_withdrawal_transaction) {
                return res.status(500)
                    .json({
                        success: false,
                        message: "No Transaction found with this ID",
                        data: []
                    })
            }
            if (find_withdrawal_transaction.status != 'PENDING') {
                return res.status(500)
                    .json({
                        success: false,
                        message: "Transaction status already completed"
                    })
            }
            let newAmount = find_withdrawal_transaction.amount + find_withdrawal_transaction.fee;
            let details;
            if (status == 'REJECTED') {

                details = await WalletTransaction.updateOne(
                    { _id: _id },
                    {
                        $set: { status: status, transaction_hash: transaction_hash, amount: newAmount, fee: 0 }
                    },
                    { upsert: true }
                )

                await updateBalance(find_withdrawal_transaction.user_id, find_withdrawal_transaction.currency_id, newAmount)
                await update_locked_balance(find_withdrawal_transaction.user_id, find_withdrawal_transaction.currency_id, -find_withdrawal_transaction.amount)


            } else {
                await update_locked_balance(find_withdrawal_transaction.user_id, find_withdrawal_transaction.currency_id, -find_withdrawal_transaction.amount)
            }
            if (status != "REJECTED") {
                details = await WalletTransaction.updateOne(
                    { _id: _id },
                    {
                        $set: { status: status, transaction_hash: transaction_hash }
                    },
                    { upsert: true }
                )
            }
            await email_marketing('withdrawal_admin_confirmation', find_withdrawal_transaction, user_data.emailId)
            // Log activity
            let activity_data = {
                Activity: "Admin Withdrawal Status Changed",
                adminIP: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
                adminId: adminId,
                userId: user_data._id,
                date: new Date()
            };
            let add_logs = await logs.create(activity_data);
            return res.status(200)
                .json({
                    success: true,
                    message: 'Withdrawal Status Updatted',
                    data: details
                })
        } catch (error) {
            return res.status(500)
                .json({
                    success: false,
                    message: error.message,
                    data: []
                })
        }
    },

    // get_admin_commission: async (req, res) => {
    //     try {
    //         let list = await AdminCommission.aggregate([
    //             { $addFields: { currencyId: { $toObjectId: "$currency_id" } } },
    //             {
    //                 $lookup: {
    //                     from: "currencies",
    //                     localField: "currencyId",
    //                     foreignField: "_id",
    //                     as: "coins",
    //                 },
    //             },
    //             { $unwind: '$coins' },
    //             { $addFields: { short_name: '$coins.short_name' } },
    //             { $project: { coins: 0 } }
    //         ]).sort({ createdAt: -1 });
    //         let count = await AdminCommission.countDocuments();
    //         if (list.length > 0) {
    //             return res.status(200).json({
    //                 success: true,
    //                 message: 'Admin Trading commission fetched successfully',
    //                 data: list,
    //                 totalCount: count
    //             })
    //         } else {
    //             return res.status(200).json({
    //                 success: true,
    //                 message: 'Admin Trading commission fetched successfully',
    //                 data: []
    //             })
    //         }
    //     } catch (error) {
    //         return res.status(500).json({
    //             success: false,
    //             message: error.message,
    //             data: []
    //         })
    //     }
    // },

    get_admin_commission: async (req, res) => {
        try {
            // Set default values for limit and skip with fallback to ensure they're positive numbers
            const limit = Math.max(1, parseInt(req.body.limit) || 10);
            const skip = Math.max(0, parseInt(req.body.skip) || 0);

            // Aggregation pipeline to get the list of commissions
            const list = await AdminCommission.aggregate([
                {
                    $skip: skip
                },
                {
                    $limit: limit
                },
                {
                    $addFields: { currencyId: { $toObjectId: "$currency_id" } }
                },
                {
                    $lookup: {
                        from: "currencies",
                        localField: "currencyId",
                        foreignField: "_id",
                        as: "coins",
                    },
                },
                {
                    $unwind: "$coins"
                },
                { $project: { coins: 0 } },
                {
                    $sort: { createdAt: -1 }
                },

            ]);

            // Count the total documents only once to optimize performance
            const count = await AdminCommission.countDocuments();

            return res.status(200).json({
                success: true,
                message: 'Admin Trading commission fetched successfully',
                data: list,
                totalCount: count,
                currentPage: Math.ceil(skip / limit) + 1,
                totalPages: Math.ceil(count / limit)
            });

        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            });
        }
    },



    get_users_trade_history: async (req, res) => {
        try {
            const { userId } = req.body;
            let list = await Trades.find({ user_id: userId });
            if (list != null) {
                return res.status(200).json({ success: true, message: 'Trading history of this user fetched successfully', data: list })
            } else {
                return res.status(200).json({ success: true, message: 'Trading history of this user fetched successfully', data: [] })
            }

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    //OLD Code without matching logins data
    // get_trade_history: async(req, res) => {
    //     try {
    //         let list = await Trades.aggregate([
    //             { $addFields: { userObjId: { $toObjectId: "$base_currency_id" } } },
    //             { $addFields: { baseUserId: { $toObjectId: "$user_id" }}  },
    //             {
    //                 $lookup: {
    //                     from: 'currencies',
    //                     localField: 'userObjId',
    //                     foreignField: '_id',
    //                     as: 'data'
    //                 }
    //             },
    //             { $unwind: '$data'},
    //             {
    //                 $lookup: {
    //                     from: 'logins',
    //                     localField: 'baseUserId',
    //                     foreignField: '_id',
    //                     as: 'userData'
    //                 }
    //             },
    //             { $unwind: '$userData'},
    //             { $addFields: {main_currency: '$data.short_name', user_email: '$userData.emailId'}},
    //             { $project: { data: 0, userData: 0}}
    //         ]).sort({createdAt : -1});

    //         let totalCount = await Trades.countDocuments();

    //         if(list.length > 0) {
    //             return res.status(200).json({ success: true, message: 'Trading history of all users fetched successfully', data: list, totalCount : totalCount})
    //         } else {
    //             return res.status(200).json({ success: true, message: 'Trading history of all users fetched successfully', data: [], totalCount : totalCount})
    //         }

    //     } catch (error) {
    //         return res.status(500).json({success: false, message: error.message, data: []})
    //     }
    // },

    get_trade_history: async (req, res) => {
        try {
            const { skip, limit } = req.body;
            const parsedSkip = parseInt(skip) || 0;
            const parsedLimit = parseInt(limit) || 100;

            let result = await Trades.aggregate([
                {
                    $addFields: {
                        userObjId: { $toObjectId: "$base_currency_id" },
                        baseUserId: { $toObjectId: "$user_id" }
                    }
                },
                {
                    $lookup: {
                        from: 'logins',
                        localField: 'baseUserId',
                        foreignField: '_id',
                        as: 'userData'
                    }
                },
                { $unwind: '$userData' }, // Ensure that only documents with matching user_id in logins are kept
                {
                    $facet: {
                        data: [
                            {
                                $lookup: {
                                    from: 'currencies',
                                    localField: 'userObjId',
                                    foreignField: '_id',
                                    as: 'data'
                                }
                            },
                            { $unwind: '$data' },
                            { $addFields: { main_currency: '$data.short_name', user_email: '$userData.emailId', user_mobileNumber: '$userData.mobileNumber' } },
                            { $project: { data: 0, userData: 0 } },
                            { $sort: { createdAt: -1 } }, // Sort by createdAt in descending order
                            { $skip: parsedSkip },
                            { $limit: parsedLimit }
                        ],
                        totalCount: [
                            { $count: "count" }
                        ]
                    }
                },
                {
                    $project: {
                        data: 1,
                        totalCount: { $arrayElemAt: ["$totalCount.count", 0] }
                    }
                }
            ]);

            if (result.length > 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Trading history of all users fetched successfully',
                    data: result[0].data,
                    totalCount: result[0].totalCount || 0
                });
            } else {
                return res.status(200).json({
                    success: true,
                    message: 'Trading history of all users fetched successfully',
                    data: [],
                    totalCount: 0
                });
            }

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },


    get_user_wallet: async (req, res) => {
        try {
            const { userId } = req.body;

            // Find user's wallets
            let wallet = await Wallets.find({ user_id: userId });

            // Create an array to store updated wallet data
            const updatedWallets = [];

            // Loop through each wallet
            for (const data of wallet) {
                try {
                    // Find the transaction fee data for the currency
                    let feeData = await Currency.findOne({ short_name: data.short_name });

                    // If transaction fee data is found, add it to the wallet object
                    if (feeData) {
                        let tfee = feeData.transaction_fee;

                        // Create a new object with the additional transaction_fee property
                        const updatedData = {
                            ...data.toObject(), // Convert Mongoose document to plain object
                            transaction_fee: tfee
                        };

                        // Add the updated data to the response array
                        updatedWallets.push(updatedData);

                    } else {
                        console.log(`No transaction fee data found for currency: ${data.short_name}`);
                    }
                } catch (error) {
                    console.error(`Error processing wallet data: ${error.message}`);
                }
            }

            if (wallet != null) {
                return res.status(200).json({ success: true, message: 'User wallet fetched successfully', data: updatedWallets });
            } else {
                return res.status(200).json({ success: true, message: 'User wallet fetched successfully', data: [] });
            }
        } catch (error) {
            console.error(`Error processing wallet data: ${error.message}`);
            return res.status(500).json({ success: false, message: 'An error occurred while fetching user wallet', error: error.message });
        }
    },


    admin_upi: async (req, res) => {
        try {
            const { _id, upi_id } = req.body;
            let upi_image;

            let check_upi = await upiValidation(upi_id);

            if (!check_upi) {
                return res.status(200).json({
                    success: true,
                    message: "UPI Id is invalid, Please enter valid UPI Id",
                    data: [],
                });
            } else {
                if (req.file != undefined) {
                    upi_image = `uploads/${req.file.filename}`;
                }

                let list = {};
                list.upi_id = upi_id,
                    list.upi_image = upi_image

                let admin_upi = await AdminUpiDetails.updateOne({ _id: _id },
                    {
                        $set: {
                            upi_id: upi_id,
                            upi_image: upi_image
                        }
                    }, { upsert: true }
                )

                if (admin_upi.upsertedCount > 0 || admin_upi.modifiedCount > 0) {
                    return res.status(200).json({
                        success: true,
                        message: "UPI Details added successfully",
                        data: admin_upi
                    })
                } else {
                    return res.status(200).json({
                        success: true,
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

    get_upi_details: async (req, res) => {
        try {
            let bank_details = await AdminUpiDetails.find()
            return res.status(200).json({
                success: true,
                message: "UPI Details fetched successfully",
                data: bank_details
            })
        } catch (error) {
            return res.status(500).json({
                success: false,
                message: error.message,
                data: []
            })
        }
    },


    p2p_currencies: async (req, res) => {
        try {
            const { currency_short_name, type } = req.body;

            if (type === 'CRYPTO') {

                let currency_update = await Currency.updateOne({ short_name: currency_short_name },
                    { $set: { p2p: true } },
                    { upsert: true }
                );

                if (currency_update.upsertedCount > 0 || currency_update.modifiedCount > 0) {
                    return res.status(200).json({ success: true, message: "Currency added to P2P List" })
                } else {
                    return res.status(500).json({ success: false, message: "Some error occured, Please try again later", data: [] })
                }
            } else {
                let currency_update = await Currency.updateOne({ short_name: currency_short_name },
                    { $set: { p2p_fiat: true } },
                    { upsert: true }
                );

                if (currency_update.upsertedCount > 0 || currency_update.modifiedCount > 0) {
                    return res.status(200).json({ success: true, message: "Currency added to P2P List" })
                } else {
                    return res.status(500).json({ success: false, message: "Some error occured, Please try again later", data: [] })
                }
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    remove_currency: async (req, res) => {
        try {
            let { currency_short_name, type } = req.body;

            if (type === "CRYPTO") {

                let currency_update = await Currency.updateOne({ short_name: currency_short_name },
                    { $set: { p2p: false } },
                    { upsert: true }
                );

                if (currency_update.upsertedCount > 0 || currency_update.modifiedCount > 0) {
                    return res.status(200).json({ success: true, message: "Currency removed from P2P List" })
                } else {
                    return res.status(500).json({ success: false, message: "Some error occured, Please try again later", data: [] })
                }
            } else {
                let currency_update = await Currency.updateOne({ short_name: currency_short_name },
                    { $set: { p2p_fiat: false } },
                    { upsert: true }
                );

                if (currency_update.upsertedCount > 0 || currency_update.modifiedCount > 0) {
                    return res.status(200).json({ success: true, message: "Currency removed from P2P List" })
                } else {
                    return res.status(500).json({ success: false, message: "Some error occured, Please try again later", data: [] })
                }
            }

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    update_maintenance: async (req, res) => {
        try {
            const { _id, status } = req.body;
            let update = await Admin.updateOne({ _id: _id }, { $set: { maintenance: status } }, { upsert: true });
            if (update.upsertedCount > 0 || update.modifiedCount > 0) {
                return res.status(200).json({ success: true, message: 'Updated successfully', data: [] })
            } else {
                return res.status(406).json({ success: false, message: 'some error occured', data: [] })
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

    get_maintenance: async (req, res) => {
        try {

            let data = await Admin.findOne({ admin_type: 1 }).select('maintenance');
            if (data != null) {
                return res.status(200).json({ success: true, message: '', data: data })
            } else {
                return res.status(406).json({ success: false, message: 'No data found', data: [] })
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

    edit_bank_details: async (req, res) => {
        try {
            const { _id, bank_name, account_number, holder_name, ifsc, branch } = req.body;

            let add_details = await AdminBank.updateOne({ _id: _id },
                {
                    $set: {
                        account_number: account_number,
                        bank_name: bank_name,
                        holder_name: holder_name,
                        ifsc: ifsc,
                        branch: branch
                    }
                },
                { upsert: true }
            )
            if (add_details.upsertedCount > 0 || add_details.modifiedCount > 0) {
                return res.status(200).json({
                    success: true,
                    message: 'Bank Details Edited successfully!',
                    data: []
                })
            } else {
                return res.status(406).json({
                    success: false,
                    message: 'some error occured!',
                    data: []
                })
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


    pending_bank_details: async (req, res) => {
        try {
            let list = await UserBanks.find({ verified: 0 });
            if (list.length > 0 || list) {
                return res.status(200).json({ success: true, message: "Pending Bank details of Users", data: list })
            } else {
                return res.status(500).json({ success: false, message: "No Pending data found!", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    approve_bank_details: async (req, res) => {
        try {
            let list = await UserBanks.find({ verified: 1 });
            if (list.length > 0 || list) {
                return res.status(200).json({ success: true, message: "Approve Bank details of Users", data: list })
            } else {
                return res.status(500).json({ success: false, message: "No approve data found!", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    reject_bank_details: async (req, res) => {
        try {
            let list = await UserBanks.find({ verified: 2 });
            if (list.length > 0 || list) {
                return res.status(200).json({ success: true, message: "Rejected Bank details of Users", data: list })
            } else {
                return res.status(500).json({ success: false, message: "No rejected data found!", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    verify_users_bank_details: async (req, res) => {
        try {
            let { _id, status } = req.body
            let data = await UserBanks.updateOne({ _id: _id }, { $set: { verified: status } }, { upsert: true });

            if (data.upsertedCount > 0 || data.modifiedCount > 0) {
                return res.status(200).json({
                    success: true,
                    message: 'users bank details verified successfully',
                    data: []
                })
            } else {
                return res.status(200).json({
                    success: true,
                    message: 'some error occured while verifing users bank details',
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

    pending_upi_details: async (req, res) => {
        try {
            let list = await userUpiDetails.find({ verified: 0 });
            if (list.length > 0 || list) {
                return res.status(200).json({ success: true, message: "Pending UPI details of Users", data: list })
            } else {
                return res.status(500).json({ success: false, message: "No Pending data found!", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    approve_upi_details: async (req, res) => {
        try {
            let list = await userUpiDetails.find({ verified: 1 });
            if (list.length > 0 || list) {
                return res.status(200).json({ success: true, message: "Approve UPI details of Users", data: list })
            } else {
                return res.status(500).json({ success: false, message: "No approve data found!", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    reject_upi_details: async (req, res) => {
        try {
            let list = await userUpiDetails.find({ verified: 2 });
            if (list.length > 0 || list) {
                return res.status(200).json({ success: true, message: "Rejected UPI details of Users", data: list })
            } else {
                return res.status(500).json({ success: false, message: "No rejected data found!", data: [] })
            }
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })
        }
    },

    verify_users_upi_details: async (req, res) => {
        try {
            let { _id, status } = req.body
            let data = await userUpiDetails.updateOne({ _id: _id }, { $set: { verified: status } }, { upsert: true });

            if (data.upsertedCount > 0 || data.modifiedCount > 0) {
                return res.status(200).json({
                    success: true,
                    message: 'users UPI details verified successfully',
                    data: []
                })
            } else {
                return res.status(200).json({
                    success: true,
                    message: 'some error occured while verifing users UPI details',
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

    all_user_wallet_backup: async (req, res) => {
        try {
            let data = [];
            let all_users = await Users.find().select('_id firstName lastName emailId mobileNumber');

            for (let user of all_users) {
                // Fetch wallet data for each user
                let wallet_data = await Wallets.find({ user_id: user.id, short_name: { $in: ['CVT', 'USDT'] } }).sort('createdAt').select('user_id short_name balance locked_balance');

                let cvtBalance = 0;
                let cvtLockedBalance = 0;
                let usdtBalance = 0;
                let usdtLockedBalance = 0;
                let cvtTotal;
                let usdtTotal;


                wallet_data.forEach(wallet => {
                    if (wallet.short_name === 'CVT') {
                        cvtBalance = wallet.balance;
                        cvtLockedBalance = wallet.locked_balance;
                        cvtTotal = cvtBalance + cvtLockedBalance
                    } else if (wallet.short_name === 'USDT') {
                        usdtBalance = wallet.balance;
                        usdtLockedBalance = wallet.locked_balance;
                        usdtTotal = usdtBalance + usdtLockedBalance
                    }
                });

                let user_data = {
                    user_id: user._id,
                    firstName: user.firstName,
                    lastName: user.lastName,
                    emailId: user.emailId,
                    mobileNumber: user.mobileNumber,
                    cvtBalance: cvtBalance,
                    cvtLockedBalance: cvtLockedBalance,
                    cvtTotal: cvtTotal,
                    usdtBalance: usdtBalance,
                    usdtLockedBalance: usdtLockedBalance,
                    usdtTotal: usdtTotal
                };

                data.push(user_data)
            }

            return res.status(200).json({ success: true, message: "User Data Backup Fetched", data: data });
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },

    // manage partner status
    partner_user_active_inactive: async (req, res) => {
        try {
            let { admin_apporval, partner_id } = req.body;
            let partner = await Partner.findOne({ _id: new ObjectId(partner_id) });

            if (!partner) {
                return res.status(403).json({ success: false, message: "Partner Data Not Found.", data: [] });
            }

            if (admin_apporval === "REJECTED") {
                await Partner.updateOne({ _id: new ObjectId(partner_id) }, {
                    $set: {
                        admin_apporval: admin_apporval,
                        status: "INACTIVE"
                    }
                });
            }

            if (admin_apporval === "APPROVED") {
                await Partner.updateOne({ _id: new ObjectId(partner_id) }, {
                    $set: {
                        admin_apporval: admin_apporval,
                        status: "ACTIVE"
                    }
                });

                const wallet = await Wallets.findOne({ user_id: partner_id, short_name: "USDT" });

                if (wallet && wallet.bonusCreditedIfPartner !== true) {
                    const depositAmount = 1000; // Define the initial deposit amount
                    const bonusAmount = depositAmount * 0.2; // Calculate the bonus amount

                    // Update wallet with deposit and bonus
                    await Wallets.updateOne(
                        { user_id: partner_id, short_name: "USDT" },
                        {
                            $inc: { locked_balance: depositAmount + bonusAmount },
                            $set: { bonusCreditedIfPartner: true }
                        }
                    );
                }
            }

            return res.status(200).json({ success: true, message: "Partner Data Fetched Successfully.", data: partner });

        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] });
        }
    },

    // create partner by admin
    create_partner_by_admin: async (req, res) => {
        try {
            let { email, password } = req.body;
            const hashedPassword = await Bcrypt.passwordEncryption(password);

            let find_partner = await Partner.findOne({ email: email });
            if (find_partner) {
                return res.
                    status(403).
                    json({
                        success: false,
                        message: "Partner with this mail id is already exist.",
                        data: []
                    });
            }

            const partner = await Partner.create({
                email: email,
                password: hashedPassword,
                type: 1
            });
            let partner_id = partner._id.toString();
            let find_partner_wallet = await Wallets.findOne({ user_id: partner_id });

            if (!find_partner_wallet) {
                let a = await create_wallet_for_partner(partner_id);
                return res.
                    status(200).
                    json({
                        success: true,
                        message: "Partner created successfully.",
                        data: partner
                    });
            }
        } catch (error) {
            return res.
                status(500).
                json({
                    success: false,
                    message: error,
                    data: []
                });
        }
    },

    // edit partner by admin
    edit_partner_by_admin: async (req, res) => {
        try {
            let { email, password, userName, phoneNumber, user_id } = req.body;
            let profilePicture = `uploads/${req.file.filename}`;

            let partner = await Partner.findOne({ _id: new ObjectId(user_id) });

            if (!partner) {
                return res.
                    status(403).
                    json({
                        success: false,
                        message: "Partner not found.",
                        data: []
                    });
            }

            if (partner.email == email) {
                return res.
                    status(403).
                    json({
                        success: false,
                        message: "Partner with this mail id is already exist.",
                        data: []
                    });
            }

            await Partner.updateOne({ _id: new ObjectId(user_id) }, {
                $set: {
                    email: email,
                    password: password,
                    userName: userName,
                    phoneNumber: phoneNumber,
                    profilePicture: profilePicture
                }
            })

            return res.
                status(200).
                json({
                    success: true,
                    message: "Partner data updated successfully.",
                    data: []
                });

        } catch (error) {
            return res.
                status(500).
                json({
                    success: false,
                    message: error,
                    data: []
                });
        }
    },

    view_partner_profile: async (req, res) => {
        try {
            let partner_id = req.params.id;

            let partner = await Partner.findOne({ _id: new ObjectId(partner_id) });
            if (!partner) {
                return res.
                    status(403).
                    json({
                        success: false,
                        message: "Partner not found",
                        data: []
                    });
            }

            return res.
                status(200).
                json({
                    success: true,
                    message: "Partner data fetch successfully.",
                    data: partner
                });
        } catch (error) {
            return res.
                status(200).
                json({
                    success: false,
                    message: error,
                    data: []
                });
        }
    },

    delete_partner: async (req, res) => {
        try {
            const { id } = req.params;
            let delete_partner = await Partner.findByIdAndDelete({ _id: id })

            return res.status(200).json({ success: true, message: "Partner Deleted Successfully", data: delete_partner })
        } catch (error) {
            return res.status(500).json({ success: false, message: error.message, data: [] })

        }
    },

    getTodaysTotalDeposit: async (req, res) => {
        try {
            // Get the start of today (00:00:00) and end of today (23:59:59)
            const startOfDay = new Date();
            startOfDay.setHours(0, 0, 0, 0);
            const endOfDay = new Date();
            endOfDay.setHours(23, 59, 59, 999);

            // Find all deposit transactions made today
            const depositTransactions = await WalletTransaction.find({
                transaction_type: 'DEPOSIT',
                createdAt: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });

            const withdrawalTransactions = await WalletTransaction.find({
                transaction_type: 'WITHDRAWAL',
                createdAt: {
                    $gte: startOfDay,
                    $lte: endOfDay
                }
            });

            const withdrawalTransactionsPending = await WalletTransaction.find({
                transaction_type: 'WITHDRAWAL',
                status: "PENDING",
            });

            // Calculate the total deposit amount
            const totalAmount = depositTransactions.reduce((acc, transaction) => acc + transaction.amount, 0);
            const totalCount = depositTransactions.length;

            return res.status(200).json({
                success: true,
                totalDepositAmount: totalAmount,
                totalDepositCount: totalCount,
                withdrawalTransactions: withdrawalTransactions.length,
                withdrawalTransactionsPending: withdrawalTransactionsPending.length
            });
        } catch (error) {
            console.error("Error fetching today's total deposit amount:", error);
            return res.status(500).json({ success: false, message: "Internal Server Error" });
        }
    },
}