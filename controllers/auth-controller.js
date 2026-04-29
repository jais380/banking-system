const mongoose = require("mongoose");
const User = require("../models/user-models");
const { validateBVN, validateNIN } = require("../services/nibss-services");
const { sanitizePhoneNumber, hashPassword, comparePassword, generateOTP } = require('../utils/helper');
const { loadEmailTemplate } = require("../utils/emailTemplate");
const { sendEmail } = require("../utils/mailer");
const jwt = require("jsonwebtoken");

exports.register = async (req, res) => {
    let session = null;
    try{
        const { email, password, phone, dob, authId, authType } = req.body;

        //trim the entries
        const fields = {
            tEmail: email.trim(),
            tPassword: password.trim(),
            tPhone: phone.trim(),
            tDob: dob.trim(),
            tAuthId: authId.trim(),
            tAuthType: authType.trim()
        };

        //ensure input fields are strings and not empty/null/undefined
        for(const key in fields) {
            const value = fields[key];

            if(!value || typeof value !== "string" || value === "") {
                return res.status(400).json({error: `${key.slice(1)} must be provided and cannot be empty`});
            }
        }

        //ensure dob is valid
        const isDate = new Date(fields.tDob);

        if (isNaN(isDate.getTime()) || isDate.getTime() > Date.now()) {
            return res.status(400).json({error: "Provide a valid dob"});
        }

        //ensure email does not exist
        const existingEmail = await User.exists({email: fields.tEmail});

        if(existingEmail) {
            return res.status(400).json({ message: "Email already exists" });
        }

        //ensure authType is either bvn or nin
        if(fields.tAuthType !== "bvn" && fields.tAuthType !== "nin") {
            return res.status(400).json({ message: "Invalid authType. Expected bvn or nin" });
        }

        let result;
        let phoneNumber;
        let record;

        //validation based on authType(bvn or nin)
        if(fields.tAuthType === "bvn") {
            record = await validateBVN(fields.tAuthId);
            result = record.data;
            phoneNumber = sanitizePhoneNumber(fields.tPhone);
            const phoneNumberBVN = sanitizePhoneNumber(result.phone);

            const validPhoneNumber = /^\d{10}$/.test(phoneNumber);

            if(!validPhoneNumber) {
                return res.status(400).json({error: "Phone number provided is not valid"});
            }

            if(phoneNumber !== phoneNumberBVN) {
                return res.status(400).json({error: "Phone number provided does not match BVN records"});
            }

        } else if(fields.tAuthType === "nin") {
            record = await validateNIN(fields.tAuthId);
            result = record.response;
            phoneNumber = sanitizePhoneNumber(fields.tPhone);

            const validPhoneNumber = /^\d{10}$/.test(phoneNumber);

            if(!validPhoneNumber) {
                return res.status(400).json({error: "Phone number provided is not valid"})
            }
        }

        //ensure phone number does not exist
        const existingPhone = await User.exists({phone: phoneNumber});

        if(existingPhone) {
            return res.status(400).json({ message: "Phone number already exists" });
        }

        //confirm DOB matches
        const inputDate = isDate.toISOString().split("T")[0];
        const recordDate = new Date(result.dob).toISOString().split("T")[0];

        if(inputDate !== recordDate) {
            return res.status(400).json({error: `DOB provided does not match ${fields[tAuthType].toUpperCase()} records`});
        }

        //hash password
        const hashedPassword = await hashPassword(fields.tPassword);

        //generate OTP and set expiry
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + (10 * 60000));

        //make use of transactions to ensure user creation happens with otp success
        session = await mongoose.startSession();

        //start transaction
        session.startTransaction();

        //create user in transaction
        const data = await User.create([{
            firstName: result.firstName,
            lastName: result.lastName,
            email: fields.tEmail,
            password: hashedPassword,
            phone: phoneNumber,
            dob: fields.tDob,
            authId: result.bvn ? result.bvn : result.nin,
            authType: fields.tAuthType,
            tempOtp: otpCode,
            expiresAt
        }], { session });

        //load email template
        const html = loadEmailTemplate("otpTemplate", {otpCode});

        //send otp via email
        await sendEmail(fields.tEmail, "ONE TIME OTP", html);

        //commit session
        await session.commitTransaction();

        return res.status(201).json({
            message: "User Created Successfully",
            response: {
                id: data[0]._id,
                firstName: data[0].firstName,
                lastName: data[0].lastName,
                email: data[0].email,
                phone: data[0].phone,
                dob: data[0].dob,
                authId: data[0].authId,
                authType: data[0].authType,
                emailVerified: data[0].emailVerified
            }
        })

    } catch(error) {
        console.log(error);

        //abort session
        if (session) await session.abortTransaction();
        return res.status(500).json({ error: "Internal Server Error" });
    } finally {
        //end session
        if (session) session.endSession();
    }
}

exports.resendOtp = async (req, res) => {
    let session = null;
    try {
        const { email } = req.body;

        //ensure email is not null/undefined/empty string
        if(!email || email.trim() === "") {
            return res.status(400).json({error: "Email must be provided"});
        }

        const tEmail = email.trim();

        //check if email exist
        const existingUser = await User.findOne({email: tEmail});

        if(!existingUser || existingUser.emailVerified) {
            return res.status(400).json({error: "Email does not exist or is already verified"});
        }

        //check if the time of expiry is remains more than 8 mins
        if((existingUser.expiresAt.getTime() - Date.now()) > 8 * 60000) {
            return res.status(429).json({error: "Too Many Requests"});
        }

        //generate otp and set expiresAt
        const otpCode = generateOTP();
        const expiresAt = new Date(Date.now() + 10 * 60000);

        //start session
        session = await mongoose.startSession();

        //start transaction
        session.startTransaction();

        existingUser.tempOtp = otpCode;
        existingUser.expiresAt = expiresAt;

        //save otp and expiration in transaction
        await existingUser.save({session});

        //load html template
        const html = loadEmailTemplate("otpTemplate", {otpCode});

        //send email
        await sendEmail(tEmail, "ONE TIME OTP", html);

        //commit email
        await session.commitTransaction();

        return res.status(200).json({
            message: "OTP sent successfully"
        });
    } catch(error) {
        console.log(error);

        //abort session
        if (session) await session.abortTransaction();
        return res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (session) session.endSession();
    }
}

exports.verifyEmail = async (req, res) => {
    let session = null;
    try {
        const { email, otpCode } = req.body;

        //ensure email and otpCode are not null/undefined/empty string
        if(!email || email.trim() === "" || !otpCode || otpCode.trim() === "") {
            return res.status(400).json({error: "Email and OTP must be provided"});
        }

        const tEmail = email.trim();
        const tOtpCode = otpCode.trim();

        //find user with the email and otpCode
        const existingUser = await User.findOne({email: tEmail});

        if(!existingUser) {
            return res.status(404).json({error: "User not found"});
        }

        //check if user is verified
        if(existingUser.emailVerified) {
            return res.status(400).json({error: "User is already verified"});
        }

        //check if otp matches saved otp
        if(existingUser.tempOtp !== tOtpCode) {
            return res.status(400).json({error: "Invalid OTP"});
        }

        //check if otp has expired
        if(Date.now() > existingUser.expiresAt.getTime()) {
            return res.status(400).json({error: "OTP has expired"});
        }

        //start session
        session = await mongoose.startSession();

        //start transaction
        session.startTransaction();

        //reset otp and expiry to null and emailVerified to true
        existingUser.tempOtp = null;
        existingUser.expiresAt = null;
        existingUser.emailVerified = true;

        await existingUser.save({session});

        //load email template
        const html = loadEmailTemplate("welcomeTemplate", {
            firstName: existingUser.firstName,
            actionLink: "https://google.com"
        });

        //send email
        await sendEmail(tEmail, "WELCOME!!", html);

        //commit transaction
        await session.commitTransaction();

        return res.status(200).json({
            message: "Email Verified!!"
        });

    } catch(error) {
        console.log(error);

        //abort session
        if (session) await session.abortTransaction();
        return res.status(500).json({ error: "Internal Server Error" });
    } finally {
        if (session) session.endSession();
    }
}

exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        //ensure email and password are not null/undefined/empty string
        if(!email || email.trim() === "" || !password || password.trim() === "") {
            return res.status(400).json({error: "Email and Password must be provided"});
        }

        const tEmail = email.trim();
        const tPassword = password.trim();

        //find user with the email and otpCode
        const existingUser = await User.findOne({email: tEmail});

        if(!existingUser) {
            return res.status(404).json({error: "User not found"});
        }

        //check if user is verified
        if(!existingUser.emailVerified) {
            return res.status(400).json({error: "User is not verified"});
        }

        //verify password
        const validPassword = await comparePassword(tPassword, existingUser.password);

        if(!validPassword) {
            return res.status(400).json({error: "Wrong Password"});
        }

        //jwt sign
        const token = jwt.sign({
            id: existingUser._id,
            email: existingUser.email,
            phone: existingUser.phone
        }, process.env.JWT_SECRET, {expiresIn: "1h"});

        return res.status(200).json({
            message: "User Logged In Successfully",
            response: {
                token,
                id: existingUser._id,
                firstName: existingUser.firstName,
                lastName: existingUser.lastName,
                email: existingUser.email,
                phone: existingUser.phone,
                dob: existingUser.dob,
                authId: existingUser.authId,
                authType: existingUser.authType,
                emailVerified: existingUser.emailVerified
            }
        })

    } catch(error) {
        console.log(error);
        return res.status(500).json({error: "Internal Server Error"});
    }
}