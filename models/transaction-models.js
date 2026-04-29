const mongoose = require("mongoose");

const transactionSchema = new mongoose.Schema(
{
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    sender: {
        type: String,
        required: true,
        trim: true
    },

    receiver: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    transactionId: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
},
{
    timestamps: true,
    versionKey: false
}
)

module.exports = mongoose.model("Transaction", transactionSchema);