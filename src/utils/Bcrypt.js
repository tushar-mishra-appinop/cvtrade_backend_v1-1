const bcrypt = require("bcrypt");

module.exports = {
    // Function to encrypt password
    passwordEncryption: (password) => {
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, 10, (err, hash) => {
                if (err) {
                    reject(err); // Reject the promise if there's an error
                } else {
                    resolve(hash); // Resolve the promise with the hashed password
                }
            });
        });
    },
    
    // Function to compare entered password with the hashed password in the database
    passwordComparison: (enteredPassword, dbPassword) => {
        return new Promise((resolve, reject) => {
            bcrypt.compare(enteredPassword, dbPassword, (err, same) => {
                if (err) {
                    reject(err); // Reject the promise if there's an error
                } else {
                    resolve(same); // Resolve the promise with the comparison result
                }
            });
        });
    }
};
