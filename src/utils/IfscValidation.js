module.exports = {
    ifscValidation : async (ifsc) => {
        if (ifsc == '' ) {
            throw Error = new Error("Field empty. Enter a valid IFSC code!")
        } else {
            let regexIfsc = /^[A-Z]{4}0[A-Z0-9]{6}$/;
            if (!ifsc.match(regexIfsc)) {
                throw Error = new Error("Invalid IFSC Code!!")
            }
        }
    }
}