const express = require('express');
const router = express.Router();
const { fetchAccount, makeTransfer, transactionHistory } = require("../controllers/transaction-controller");
const auth = require("../middleware/auth");


router.get("/name-enquiry/:accountNumber", auth, fetchAccount);
router.post("/transfer", auth, makeTransfer);
router.get("/transaction-history", auth, transactionHistory);

module.exports = router;