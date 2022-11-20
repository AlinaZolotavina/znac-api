const {
  NODEMAILER_SERVISE,
  NODEMAILER_HOST,
  NODEMAILER_USER,
  NODEMAILER_PASSWORD,
  // ETHEREAL_HOST,
  // ETHEREAL_USER,
  // ETHEREAL_PASSWORD,
} = process.env;
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
  service: NODEMAILER_SERVISE,
  host: NODEMAILER_HOST,
  auth: {
    user: NODEMAILER_USER,
    pass: NODEMAILER_PASSWORD,
  },
});
// const transporter = nodemailer.createTransport({
//   host: ETHEREAL_HOST,
//   // port: 587,
//   // secure: false,
//   auth: {
//     user: ETHEREAL_USER,
//     pass: ETHEREAL_PASSWORD,
//   },
// });

module.exports = transporter;
