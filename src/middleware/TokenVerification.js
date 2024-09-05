const jwt = require("../utils/Jwt");
const { JWT_SECRET } = process.env;
const UserModel = require('../models/Users');
const { ObjectId } = require("mongodb");

const token_verification = async (req, res, next) => {
    try {
        const header = req.header("Authorization");
        if (header === undefined) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized Request!",
                data: [],
            });
        }
        const token = header.replace("Bearer ", "");
        const user = await jwt.verify_token(token, JWT_SECRET);
        req.user = user.data;

        let userid = new ObjectId(user.data.userId);
        let userData = await UserModel.findOne({_id : userid});
        
        if (!userData) {
            console.error('User not found');
            return res.status(404).send('User not found');
        }

        if (userData.status != "Active") {
            console.log('UserId Deactivated');
            return res.status(403).json({
                success: false,
                message: `UserId Deactivated`,
            });
        }

        return next();
    } catch (e) {
        return res.status(401).json({
            success: false,
            message: `Token is expired`,
            data: [],
        });
    }
};

module.exports = {
    token_verification,
};