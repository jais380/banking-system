const mongoose = require("mongoose");
const User = require("../models/user-models");
const { validateBVN, validateNIN } = require("../services/nibss-services");
const { sanitizePhoneNumber, hashPassword, comparePassword, generateOTP } = require('../utils/helper');
const { loadEmailTemplate } = require("../utils/emailTemplate");
const { sendEmail } = require("../utils/mailer");

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
            return res.status(400).json({error: "DOB provided does not match BVN records"});
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
            authType: result.bvn ? "bvn" : "nin",
            otpCode,
            expiresAt
        }], { session });

        //load email template
        const html = loadEmailTemplate("otpTemplate", {otpCode});

        //send otp via email
        await sendEmail(fields.tEmail, "ONE TIME OTP", html);

        //commit session
        await session.commitTransaction();

        return res.status(200).json({
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
        return res.status(500).json({Error: `Internal Server Error`});
    } finally {
        //end session
        if (session) session.endSession();
    }
}