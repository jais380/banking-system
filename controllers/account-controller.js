const mongoose = require("mongoose");
const User = require("../models/user-models");
const Account = require("../models/account-models");
const Transaction = require("../models/transaction-models");
const { generateToken, createAccount, getBalance } = require("../services/nibss-services");
const { formatCurrency } = require("../utils/helper")

exports.getAccountProfile = async (req, res) => {
    let session = null;
    try {
        const userEmail = req.user.email;

        //find user
        const user = await User.findOne({ email: userEmail });
        if(!user){
            return res.status(404).json({error: "User does not exist"});
        }

        //generate nibss token
        const token = await generateToken();

        //check if account exists
        let account;

        account = await Account.findOne({ user: user._id });

        if(!account) {
            //create new account
            account = await createAccount({
                kycID: user.authId,
                kycType: user.authType,
                dob: user.dob
            }, token);

            if(!account) {
                return res.status(500).json({ error: "Failed to fetch account profile"});
            }

            //create account in db
            const newAccount = await Account.create({
                user: user._id,
                accountName: account.account.accountName,
                accountNumber: account.account.accountNumber,
                balance: account.account.balance * 100 //balance in kobo
            });

            return res.status(200).json({
                message: "Account Profile fetched successfully",
                response: {
                    accountName: newAccount.accountName,
                    accountNumber: newAccount.accountNumber,
                    balance: formatCurrency(newAccount.balance) //formatted balance for the frontend
                }
            });
        } else{
            //confirm balance is always the same with nibss
            const nibssAccount = await getBalance(account.accountNumber, token);

            if(!nibssAccount) return res.status(500).json({ error: "Failed to fetch account balance" });

            //normalize nibss returned balance to kobo
            const nibssBalance = nibssAccount.balance * 100;

            //check if amount reconciliation is required
            if(nibssBalance !== account.balance) {
                //start session
                session = await mongoose.startSession();

                //start transaction
                session.startTransaction();

                const txId = `external_nibss_${Date.now()}`

                if(nibssBalance > account.balance) {
                    await Transaction.create([{
                        user: user._id,
                        sender: "external",
                        receiver: account.accountNumber,
                        transactionId: txId,
                        amount: nibssBalance - account.balance, //amount in kobo
                        status: "CREDIT"
                    }], { session });

                    account.balance = nibssBalance; //balance in kobo
                } else if (nibssBalance < account.balance) {
                    await Transaction.create([{
                        user: user._id,
                        sender: account.accountNumber,
                        receiver: "external",
                        transactionId: txId,
                        amount: account.balance - nibssBalance, //amount in kobo
                        status: "DEBIT"
                    }], { session });

                    account.balance = nibssBalance; //balance in kobo
                }

                await account.save({ session });

                await session.commitTransaction();
            }

            return res.status(200).json({
                message: "Account Profile fetched successfully",
                response: {
                    accountName: account.accountName,
                    accountNumber: account.accountNumber,
                    balance: formatCurrency(account.balance) //formatted balance for the frontend
                }
            });
        }

    } catch(error) {
        console.log(error.response?.data || error.message || error);

        //abort session
        if (session) await session.abortTransaction();
        return res.status(500).json({message: "Internal Server Error"});
    } finally {
        //end session
        if (session) session.endSession();
    }
}