const crypto = require("crypto");
const { PROJECT_NAME } = process.env;
const fs = require('fs');
const path = require('path');

module.exports = {
    generate_otp: async () => {
        try {
            return Math.random().toString().substr(2, 6);
        } catch (error) {
            return res
                .status(500)
                .json({ success: false, message: error.message, data: [] });
        }
    },

    generateReferCode: async (check, email_or_phone) => {
        try {
            let user_code = (check = "email"
                ? `${email_or_phone
                    .split("@")[0]
                    .slice(0, 4)
                    .toUpperCase()}${crypto.randomInt(0, 1000000)}`
                : `${PROJECT_NAME.slice(0, 4).toUpperCase()}${crypto.randomInt(
                    0,
                    1000000
                )}`);
            return user_code;
        } catch (error) {
            return res
                .status(500)
                .json({ success: false, message: error.message, data: [] });
        }
    },

    generateRandomString() {
        const numbers = '0123456789';
        let result = '';


        // Generate the next 5 numbers
        for (let i = 0; i < 7; i++) {
            result += numbers.charAt(Math.floor(Math.random() * numbers.length));
        }

        return result;
    },

    check_type: async (value) => {
        if (value.toString().includes("@") && Object.prototype.toString.call(value) === '[object String]') {
            let regexEmail = /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/;
            if (!value.match(regexEmail)) {
                throw await apiResponse.err('Invalid Email Address', 406);
            }
            return "email";
        } else if (/^[0-9]+$/.test(value)) {
            let regexMobile = /^[0-9]+$/;
            if (!value.toString().match(regexMobile)) {
                throw await apiResponse.err('Invalid Mobile Number!', 406);
            }
            return "phone";
        }
    },

    address_validation: async (address, chain) => {
        try {
            if (chain === 'BEP20' || chain === 'RIK') {
                const bep20Regex = /^(0x)?[0-9a-fA-F]{40}$/;
                if (!bep20Regex.test(address)) {
                    return false;
                } else {
                    return true;
                }
            } else if (chain === 'TRC20') {
                const trc20Regex = /^(T|t)[A-Za-z1-9]{33}$/;
                if (!trc20Regex.test(address)) {
                    return false;
                } else {
                    return true;
                }
            }
        } catch (error) {
            throw Error = new Error(error.message)
        }
    },

    upiValidation: async (upi) => {
        if (upi == '') {
            throw Error = new Error("Field empty. Enter a valid UPI ID!")
        } else {
            const upiIdPattern = "[a-z0-9]*@[a-z]*";

            if (!upi.match(upiIdPattern)) {
                return false;
            }
            return true;

        }
    },

    logIntoLogs: async (message) => {
        const rootDirectory = path.resolve(__dirname, '..');
        const logFilePath = path.join(rootDirectory, 'queue_log.txt');
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ${message}\n`;

        fs.appendFile(logFilePath, logMessage, (err) => {
            if (err) {
                console.error('Error writing to log file:', err);
            }
        });
    },
    clearLogs: async () => {
        
        const rootDirectory = path.resolve(__dirname, '..');
        const logFilePath = path.join(rootDirectory, 'queue_log.txt');
        fs.writeFileSync(logFilePath, '', (err) => {
            if (err) {
                console.error('Error clearing log file:', err);
            } else {
                console.log('Log file cleared successfully');
            }
        });
    }
};
