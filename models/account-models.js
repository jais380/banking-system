const mongoose = require("mongoose");

const accountSchema = new mongoose.Schema(
{
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    accountName: {
        type: String,
        required: true,
        trim: true
    },

    accountNumber: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    balance: {
        type: Number,
        required: true,
        default: 0,
        min: 0
    }
},
{
    timestamps: true,
    versionKey: false
}
)

module.exports = mongoose.model("Account", accountSchema);