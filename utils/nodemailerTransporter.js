const {
  NODEMAILER_SERVICE,
  NODEMAILER_HOST,
  NODEMAILER_USER,
  NODEMAILER_PASSWORD,
} = process.env;
const nodemailer = require("nodemailer");

const transporter = nodemailer.createTransport({
  service: NODEMAILER_SERVICE,
  host: NODEMAILER_HOST,
  auth: {
    user: NODEMAILER_USER,
    pass: NODEMAILER_PASSWORD,
  },
});

module.exports = transporter;
