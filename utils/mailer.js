const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD
    }
});

exports.sendEmail = async (to, subject, html) => {
    await transporter.sendMail({
        from: `"JAI BANK - THE FUTURE IS HERE" <noreply@judeani60@gmail.com>`,
        to,
        subject,
        html
    });
}