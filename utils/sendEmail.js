const nodemailer = require("nodemailer");

//create reusable transporter using your email provider
const transporter = nodemailer.createTransport({
  service: "gmail", // or "hotmail", "yahoo", etc.
  auth: {
    user: process.env.EMAIL_USER, // put your email here or use .env
    pass: process.env.EMAIL_PASS  // your app password, not normal password
  }
});

//reusable function
async function sendEmail(to, subject, text) {
  try {
    const mailOptions = {
      from: process.env.EMAIL_USER,
      to,
      subject,
      text
    };

    await transporter.sendMail(mailOptions);
    console.log("Email sent to:", to);
  } catch (error) {
    console.error("Error sending email:", error);
  }
}

module.exports = { sendEmail };

