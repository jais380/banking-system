const mongoose = require("mongoose");

exports.connectDB = async () => {
    try {
        const con = await mongoose.connect(process.env.MONGO_URI);
        console.log(`MONGODB CONNECTED: ${con.connection.host}`);
    } catch(error) {
        console.log(error);
        process.exit(1);
    }
}