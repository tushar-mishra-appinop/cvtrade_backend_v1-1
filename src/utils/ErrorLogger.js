const fs = require("fs");
let errorLogger = (err, req, res, next) => {
    try {
        let err_msg = `${new Date()} - ${err.stack}\n`;
        fs.appendFile("./errorLogger.txt", err_msg, (error) => {
            if (error) {
            }
        });
        if (err.status) {
            return res.status(err.status).json({ success: false, message: err.message, data: [] });
        } else {
            return res.status(500).json({ success: false, message: err.message, data: [] });
        }
    } catch (error) {
        return res.status(500).json({ success: false, message: error.message, data: [] });
    }
};

module.exports = errorLogger;