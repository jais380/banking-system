const mongoose = require("mongoose");

const userSchema = new mongoose.Schema(
{
    firstName: {
        type: String,
        required: true,
        trim: true
    },

    lastName: {
        type: String,
        required: true,
        trim: true
    },

    email: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },

    password: {
        type: String,
        required: true,
        trim: true
    },

    phone: {
        type: String,
        required: true,
        unique: true,
        match: /^\d{10}$/
    },

    dob: {
        type: String,
        required: true,
        trim: true
    },

    authId: {
        type: String,
        required: true,
        trim: true
    },

    authType: {
        type: String,
        enum: ['bvn', 'nin'],
        required: true
    },

    emailVerified: {
        type: Boolean,
        default: false
    },

    tempOtp: {
        type: String,
        default: null
    },

    expiresAt: {
        type: Date,
        default: null
    }
},
{
    timestamps: true,
    versionKey: false
}
)

module.exports = mongoose.model("User", userSchema);