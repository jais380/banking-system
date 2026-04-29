const bcrypt = require("bcrypt");

exports.hashPassword = async (password) => {
  const saltOrRounds = 10;
  return await bcrypt.hash(password, saltOrRounds);
};

exports.comparePassword = async (password, hash) => {
  return await bcrypt.compare(password, hash);
};

exports.sanitizePhoneNumber = (phoneNumber) => {
  const newNumber = phoneNumber.startsWith("0")
    ? phoneNumber.slice(1)
    : phoneNumber.startsWith("+")
      ? phoneNumber.replace(/\D/g, "").slice(-10)
      : phoneNumber

  return newNumber;
}

exports.generateOTP = () => {
  const OTP = Math.floor(100000 + Math.random() * 900000);
  const formattedOTP = OTP.toString();
  return formattedOTP;
};