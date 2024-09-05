const { BSCSCAN_API } = process.env
const axios = require('axios')

const verify_bep20_token = async(contract_address) => {
    try {
        let url = `https://api.bscscan.com/api?module=contract&action=getabi&address=${contract_address}&apikey=${BSCSCAN_API}`
        let response = await axios.get(url)
        
        return response.data
    } catch(error) {
        throw new Error(error);
    }
}

module.exports = {
    verify_bep20_token
}