const express = require('express');
const router = express.Router();
const { getAccountProfile } = require("../controllers/account-controller");
const auth = require("../middleware/auth");


router.get("/account/profile", auth, getAccountProfile);

module.exports = router;