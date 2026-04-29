require("dotenv").config();
const express = require("express");
const app = express();

const { connectDB } = require("./config/db");
const port = process.env.PORT ?? 8080;

const authRoutes = require("./routes/auth-routes");

app.use(express.json());

//health check
app.get("/test", (req, res) => res.send("Server is alive!"));

app.use("/api", authRoutes);


const startServer = async (port) => {
    try {
        await connectDB();
        app.listen(port, () => {
            console.log(`Server started on ${port}`);
        });
    } catch(error) {
        console.log(error);
    }
}

startServer(port);