// const mongoose = require('mongoose');
// mongoose.set('strictQuery', true);
// // mongoose.set("debug", true);
// const { MONGO_USERNAME, MONGO_PASSWORD, MONGO_HOST, MONGO_PORT, MONGO_DB } = process.env

// const uri = `mongodb://${MONGO_USERNAME}:${encodeURIComponent(MONGO_PASSWORD)}@${MONGO_HOST}:${MONGO_PORT}/${MONGO_DB}`;

// const connect = async () => {
//     try {
//         await mongoose.connect(uri, {
//             useNewUrlParser: true,
//             useUnifiedTopology: true,
//         });

//         console.log('database is connected');
//     } catch (error) {
//         console.error('Error connecting to MongoDB:', error.message);
//         process.exit(1);
//     }
// };

// module.exports = connect;

// Create moongoose connection here & export the connection instance.
const mongoose = require("mongoose");
mongoose.set('strictQuery', true);
// mongoose.set("debug", true)

const connect = (uri) => {
    console.log(uri , " : uri");
    try {
        mongoose.connect(uri,
            {
                 useNewUrlParser: true, 
                 useUnifiedTopology: true 
            }
        );
        console.log('DB connected');
    } catch (err) {
        console.log(err.message);
        process.exit(0)
    }
}

module.exports = connect;
