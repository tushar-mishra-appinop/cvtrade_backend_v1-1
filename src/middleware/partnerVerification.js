const jwt = require("../utils/Jwt");
const { JWT_SECRET } = process.env;

const partner_verification = async (req, res, next) => {
    try {
        const Bearer_token = req.header("Authorization");
        if (Bearer_token === undefined) {
            return res.status(401).json({
                success: false,
                message: "Unauthorized Request!",
                data: [],
            });
        }
        const token = Bearer_token.replace("Bearer ", "");
        const user = await jwt.verify_token(token, JWT_SECRET);
        req.user = user.data;
         next();
    } catch (e) {
        return res.status(401).json({
            success: false,
            message: `Token is expired with message: ${e.message}`,
            data: [],
        });
    }
};

module.exports = {
    partner_verification,
};







