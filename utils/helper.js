const bcrypt = require("bcrypt");

//hash password
exports.hashPassword = async (password) => {
  const saltOrRounds = 10;
  return await bcrypt.hash(password, saltOrRounds);
};

//compare password
exports.comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

//sanitize phone number for consistensy
exports.sanitizePhoneNumber = (phoneNumber) => {
  const newNumber = phoneNumber.startsWith("0")
    ? phoneNumber.slice(1)
    : phoneNumber.startsWith("+")
      ? phoneNumber.replace(/\D/g, "").slice(-10)
      : phoneNumber

  return newNumber;
}

//generate 6 digits otp
exports.generateOTP = () => {
  const OTP = Math.floor(100000 + Math.random() * 900000);
  const formattedOTP = OTP.toString();
  return formattedOTP;
};

//format balance/amount currency for the frontend
exports.formatCurrency = (
  amountInKobo,
  currency = "NGN",
  locale = "en-NG",
) => {
  return (amountInKobo / 100).toLocaleString(locale, {
    style: "currency",
    currency: currency,
  });
};
