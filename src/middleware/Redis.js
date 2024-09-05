const redis = require("redis");
const {  REDIS_URL } = process.env;
const client = redis.createClient(REDIS_URL);
client.connect();
client.on("connect", () => {
    console.log('server is connected with redis')
});
client.on("error", () => {
    console.log('some error occured while connecting to redis client')
})
// client.set = util.promisify(client.set);
// client.get = util.promisify(client.get);
// client.expire = util.promisify(client.expire);
// client.setEx = util.promisify(client.setEx);

async function setDetails (key, data, expiry) {
    try {
        // console.log(`Cache updated for ${key}`)
        await client.set(key, JSON.stringify(data))
        await client.expire(key, expiry) // this value will be expire in 1900 seconds - 31.7 minutes
    } catch (error) {
        console.log(error.message, " : some error occured in setdetails redis function")
    }
}

// Cache middleware
async function cache (key) {
    try {    
        let data = await client.get(key)
        if(data) {
            data = JSON.parse(data);
            return data
        } else {
            return false
        }
    } catch (error) {
        console.log(error.message, " : some error occured in cache function")
    }
}

module.exports = {
    cache,
    setDetails
};
