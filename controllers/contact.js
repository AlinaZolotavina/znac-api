const MAX_NAME_LENGTH = 80;
const MAX_EMAIL_LENGTH = 254;
const MAX_MESSAGE_LENGTH = 3000;
const transporter = require("../utils/nodemailerTransporter");
const BadRequestError = require("../errors/bad-request-err");

const { NODEMAILER_USER, CONTACT_FORM_TO_EMAIL } = process.env;

const sendContactMessage = async (req, res, next) => {
  try {
    const name = req.body.name?.trim();
    const email = req.body.email?.trim().toLowerCase();
    const message = req.body.message?.trim();

    if (!name || !email || !message) {
      return next(new BadRequestError("Name, email and message are required"));
    }

    if (
      name.length > MAX_NAME_LENGTH ||
      email.length > MAX_EMAIL_LENGTH ||
      message.length > MAX_MESSAGE_LENGTH
    ) {
      return next(
        new BadRequestError("One or more fields exceed the allowed length")
      );
    }

    await transporter.sendMail({
      from: NODEMAILER_USER,
      to: CONTACT_FORM_TO_EMAIL,
      replyTo: email,
      subject: `ZNAC contact form: ${name}`,
      text: `Name: ${name}\nEmail: ${email}\n\n${message}`,
    });

    return res.status(200).send({
      message: "Message sent successfully",
    });
  } catch (err) {
    return next(err);
  }
};

module.exports = { sendContactMessage };
