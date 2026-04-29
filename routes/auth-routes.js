const express = require('express');
const router = express.Router();
const { register, resendOtp, verifyEmail, login } = require("../controllers/auth-controller")


router.post("/register", register);
router.post("/resend-otp", resendOtp);
router.post("/verify-email", verifyEmail);
router.post("/login", login);

module.exports = router;