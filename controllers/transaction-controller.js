const mongoose = require("mongoose");
const User = require("../models/user-models");
const Account = require("../models/account-models");
const Transaction = require("../models/transaction-models");
const { generateToken, getAccountName, getTransactionByRef, transfer } = require("../services/nibss-services");
const { formatCurrency } = require("../utils/helper");


exports.fetchAccount = async (req, res) => {
    try {
        const accountNumber = req.params.accountNumber;

        if(!accountNumber) {
            return res.status(400).json({error: "Account number must be provided"});
        }

        //generate token
        const token = await generateToken();

        //confirm name
        const account = await getAccountName(accountNumber, token);

        return res.status(200).json({
            message: "Account fetched successfully",
            response: account
        });
    } catch(error) {
        console.log(error.response?.data || error.message || error);

        return res.status(500).json({message: "Internal Server Error"});
    }
}

exports.makeTransfer = async (req, res) => {
    let session = null;
    try {
        const user = await User.findOne({ email: req.user.email });

        if(!user){
            return res.status(404).json({ error: "User does not exist" });
        }

        const { receiver, amount } = req.body;

        if(!receiver || receiver.trim() === "") {
            return res.status(400).json({ error: "All fields must be provided" });
        }

        //convert amount to kobo
        const amountInKobo = amount * 100;

        //generate token
        const token = await generateToken();

        //check if receiver exists in our db
        const inHouseReceiver = await Account.findOne({ accountNumber: receiver });
        if(!inHouseReceiver) {
            const validReceiver = await getAccountName(receiver, token);

            if(!validReceiver) {
                return res.status(404).json({ error: "Account does not exist" });
            }
        }

        //get sender's account
        const sender = await Account.findOne({ user: user._id });

        if(!sender) return res.status(404).json({ error: "Account does not exist" });

        //check sender has the amount to send
        if(sender.balance < amountInKobo) {
            return res.status(400).json({ error: "Insufficient Funds" });
        }

        if(sender.accountNumber === receiver) {
            return res.status(400).json({ error: "Cannot transfer to yourself" });
        }

        //initiate nibss transfer
        const data = {
            from: sender.accountNumber,
            to: receiver,
            amount: amount
        }

        const nibssTransfer = await transfer(data, token);

        //start session
        session = await mongoose.startSession();

        //start transaction
        session.startTransaction();

        //create transaction records
        await Transaction.create([{
            user: user._id,
            sender: sender.accountNumber,
            receiver,
            amount: amountInKobo,
            transactionId: nibssTransfer.reference,
            status: "DEBIT"
        }], { session });

        //update amount
        const updatedSender = await Account.findOneAndUpdate(
            { _id: sender._id, balance: { $gte: amountInKobo } }, // ONLY update if balance is still enough
            { $inc: { balance: -amountInKobo } },
            { session, new: true }
        );

        if (!updatedSender) {
            throw new Error("Concurrency error or Insufficient funds");
        }

        if(inHouseReceiver) {
            await Transaction.create([{
                user: user._id,
                sender: sender.accountNumber,
                receiver,
                amount: amountInKobo,
                transactionId: nibssTransfer.reference,
                status: "CREDIT"
            }], { session });

            inHouseReceiver.balance += amountInKobo;

            await inHouseReceiver.save({ session });
        }

        //commit transaction
        await session.commitTransaction();

        return res.status(200).json({
            message: "Transfer successful",
            response: {
                 txRef: nibssTransfer.reference,
                 sender: sender.accountNumber,
                 receiver: receiver,
                 amount: formatCurrency(amountInKobo)
            }
        });

    } catch(error) {
        console.log(error.response?.data || error.message || error);

        //abort transaction
        if(session) await session.abortTransaction();
        return res.status(500).json({message: "Internal Server Error"});

    } finally {
        if(session) session.endSession();
    }
}

exports.transactionHistory = async (req, res) => {
    try {
        const user = await User.findOne({ email: req.user.email });

        if(!user){
            return res.status(404).json({ error: "User does not exist" });
        }

        //find account
        const account = await Account.findOne({ user: user._id });

        if(!account) {
            return res.status(404).json({ error: "Account not found" });
        }

        let query;
        let status = req.query.status;
        let data = [];

        //filter out history
        if(status === "CREDIT") {
            query = { receiver: account.accountNumber, status: "CREDIT" }

        } else if(status === "DEBIT") {
            query = { sender: account.accountNumber, status: "DEBIT" }

        } else {
            query = {
                $or: [
                    { sender: account.accountNumber },
                    { receiver: account.accountNumber }
                ]
            }
        }

        const transactions = await Transaction.find(query).sort({createdAt: -1});

        //format amount before showing the user
        data = transactions.map(t => ({
            txRef: t.transactionId,
            sender: t.sender,
            receiver: t.receiver,
            amount: formatCurrency(t.amount),
            status: t.status,
            date: t.createdAt
        }));

        return res.status(200).json({
            message: "Transaction history fetched successfully",
            response: data
        });

    } catch(error) {
        console.log(error.response?.data || error.message || error);

        return res.status(500).json({message: "Internal Server Error"});

    }
}