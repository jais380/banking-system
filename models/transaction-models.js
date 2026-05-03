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
        trim: true
    },

    amount: {
        type: Number,
        required: true,
        default: 1
    },

    transactionId: {
        type: String,
        required: true,
        trim: true
    },

    status: {
        type: String,
        enum: ["CREDIT", "DEBIT"],
        required: true
    }
},
{
    timestamps: true,
    versionKey: false
}
)

module.exports = mongoose.model("Transaction", transactionSchema);