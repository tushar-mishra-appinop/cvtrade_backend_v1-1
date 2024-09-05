const mongoose = require("mongoose");
const { errorHandler } = require('../utils/CustomError')

const referralSchema = mongoose.Schema(
    {
        userId: { type: String, required: true },
        user_code: { type: String, required: true },
        sponser_id: { type: String, required: false, default: null },
        sponser_code: { type: String, required: false, default: null },
        total_referred: { type: Number, required: false, default: 0 },
    },
    { timestamps: true }
);
referralSchema.pre("updateOne", async function (next) {
    try {
        let doc = this.getUpdate().$set;
        console.log(doc,"refferal *****_____--*********");
        if (doc.sponser_id != null && doc.sponser_code != null) {
            await this.model.updateOne({ userId: doc.sponser_id }, { $inc: { total_referred: 1 } });
        }
        next();
    } catch (error) {
        console.error(error);
        throw new Error("Failed to update referral count");
    }
});


const referral = mongoose.model("referral", referralSchema);

module.exports = {
    checkReferralCode: async(referral_code) => {
        try {
            let data = await referral.findOne({ user_code: referral_code });
            if(data != null) {
                return data;
            } else {
                throw await errorHandler('No user found with this referral code', 404)
            }
        } catch (error) {
            throw await errorHandler(error.message, 406);
        }
    },

    updateReferral: async(_id, code, referral_code, userId) => {
        try {
            let data = await referral.updateOne(
                { userId: _id },
                {
                    $set: {
                        user_code: code,
                        sponser_code: referral_code,
                        sponser_id: userId,
                    },
                },
                { upsert: true }
            );
            if(data.upsertedCount > 0 || data.modifiedCount > 0) {
                return true;
            } else {
                throw await errorHandler('Some error occured while udpating referral', 406);
            }
        } catch (error) {
            throw await errorHandler(error.message, 406);
        }
    },

    createNewUser: async(_id, code) => {
        try {
            let data = await referral.updateOne(
                { userId: _id },
                {
                    $set: {
                        user_code: code,
                    },
                },
                { upsert: true }
            );
            if(data.upsertedCount > 0 || data.modifiedCount > 0) {
                return true;
            } else {
                throw await errorHandler('Some error occured while udpating referral', 406);
            }
        } catch (error) {
            throw await errorHandler(error.message, 406);
        }
    },

    findReferralByUserId: async(userId) => {
        try {
            let data = await referral.findOne({userId: userId})
            if(data != null) {
                return data;
            } else {
                return false;
            }
        } catch (error) {
            throw await errorHandler(error.message, 406);
        }
    },

    findReferredUserByCode: async(code) => {
        try {
            let data = await referral.find({sponser_code: code});
            return data;
        } catch (error) {
            throw await errorHandler(error.message, 406);
        }
    },
//   updateReferral :async (userId, code) => {
//         try {
//             // Update the referral document
//             const updateReferal = await referral.updateOne(
//                 { userId: userId },
//                 { $set: { user_code: code } },
//                 { upsert: true }
//             );
//             return updateReferal;
//         } catch (error) {
//             // Handle any errors
//             console.error('Error updating referral:', error);
//             throw error; // Optionally, rethrow the error for handling in the calling code
//         }
//     },
}