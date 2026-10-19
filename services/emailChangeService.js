const bcrypt = require("bcryptjs");
const isEmail = require("validator/lib/isEmail");
const User = require("../models/user");
const transporter = require("../utils/nodemailerTransporter");
const { emailConfirmationEmailMarkup } = require("../utils/emailHtmlMarkup");
const {
  createToken,
  hashToken,
  isToken,
  TOKEN_LIFETIME_MS,
  emailChangeFields,
  resetTokenFields,
} = require("../utils/securityTokens");
const UnauthorizedError = require("../errors/unauthorized-err");
const NotFoundError = require("../errors/not-found-err");
const ConflictError = require("../errors/conflict-err");
const BadRequestError = require("../errors/bad-request-err");
const {
  USER_NOT_FOUND_ERROR_MSG,
  WRONG_PASSWORD_ERROR_MSG,
  CONFLICT_UPDATE_EMAIL_ERROR_MSG,
  BAD_EMAIL_ERROR_MSG,
} = require("../utils/constants");

const privateFields =
  "+password +tokenVersion " +
  Object.keys(emailChangeFields)
    .map((field) => `+${field}`)
    .join(" ");
const invalidLink = () => {
  const error = new UnauthorizedError(
    "This email change link has expired, was already used, or belongs to another account"
  );
  error.code = "EMAIL_CHANGE_LINK_INVALID";
  return error;
};
const versionMatches = (version) => ({
  $eq: [{ $ifNull: ["$tokenVersion", 0] }, version],
});

const requestEmailUpdate = async ({
  userId,
  newEmail,
  currentPassword,
  tokenVersion,
}) => {
  const normalizedEmail = newEmail?.trim().toLowerCase();
  if (!normalizedEmail || !isEmail(normalizedEmail))
    throw new BadRequestError(BAD_EMAIL_ERROR_MSG);
  const user = await User.findById(userId).select("+password +tokenVersion");
  if (!user) throw new NotFoundError(USER_NOT_FOUND_ERROR_MSG);
  if (
    user.tokenVersion !== tokenVersion ||
    !currentPassword ||
    !(await bcrypt.compare(currentPassword, user.password))
  ) {
    throw new UnauthorizedError(WRONG_PASSWORD_ERROR_MSG);
  }
  if (
    normalizedEmail === user.email.toLowerCase() ||
    (await User.exists({ email: normalizedEmail }).collation({
      locale: "en",
      strength: 2,
    }))
  ) {
    throw new ConflictError(CONFLICT_UPDATE_EMAIL_ERROR_MSG);
  }

  const oldToken = createToken();
  const newToken = createToken();
  const requestId = createToken();
  const result = await User.updateOne(
    {
      _id: userId,
      password: user.password,
      $expr: {
        $and: [
          versionMatches(tokenVersion),
          { $eq: ["$email", { $literal: user.email }] },
        ],
      },
    },
    {
      $set: {
        pendingEmail: normalizedEmail,
        emailChangeCurrentEmail: user.email,
        emailChangeRequestId: requestId,
        emailChangeTokenVersion: tokenVersion,
        emailChangeExpiresAt: new Date(Date.now() + TOKEN_LIFETIME_MS),
        emailChangeOldTokenHash: hashToken(oldToken),
        emailChangeNewTokenHash: hashToken(newToken),
        emailChangeOldConfirmed: false,
        emailChangeNewConfirmed: false,
      },
    }
  );
  if (result.modifiedCount !== 1) throw invalidLink();
  const messages = [
    { to: user.email, token: oldToken, address: "current" },
    { to: normalizedEmail, token: newToken, address: "new" },
  ];
  const deliveries = await Promise.allSettled(
    messages.map(({ to, token, address }) =>
      transporter.sendMail({
        from: process.env.NODEMAILER_USER,
        to,
        subject: "Confirm your email change",
        text: `Confirm the email change from both your current and new inboxes within 20 minutes.\nhttps://znac.org/profile/update-email/${token}\nIf you did not request this change, ignore this message.`,
        html: emailConfirmationEmailMarkup(token, address),
      })
    )
  );
  if (deliveries.some((delivery) => delivery.status === "rejected")) {
    await User.updateOne(
      { _id: userId, emailChangeRequestId: requestId },
      { $unset: emailChangeFields }
    );
    throw new Error("Could not send email change confirmations");
  }
};

const findEmailChange = async ({ userId, token, tokenVersion }) => {
  if (!isToken(token) || !Number.isInteger(tokenVersion)) throw invalidLink();
  const tokenHash = hashToken(token);
  const tokenMatch = {
    $or: [
      { emailChangeOldTokenHash: tokenHash },
      { emailChangeNewTokenHash: tokenHash },
    ],
  };
  const now = new Date();
  const user = await User.findOne({
    _id: userId,
    ...tokenMatch,
    emailChangeExpiresAt: { $gt: now },
    pendingEmail: { $type: "string" },
    emailChangeRequestId: { $type: "string" },
    emailChangeTokenVersion: tokenVersion,
    $expr: {
      $and: [
        versionMatches(tokenVersion),
        { $eq: ["$email", "$emailChangeCurrentEmail"] },
      ],
    },
  }).select(privateFields);
  if (!user) {
    await User.updateOne(
      { _id: userId, ...tokenMatch, emailChangeExpiresAt: { $lte: now } },
      { $unset: emailChangeFields }
    );
    throw invalidLink();
  }
  const address =
    user.emailChangeOldTokenHash === tokenHash ? "current" : "new";
  return { user, address, tokenHash };
};

const validateEmailChangeLink = async (args) => {
  const { user, address } = await findEmailChange(args);
  return {
    address,
    pendingEmail: user.pendingEmail,
    expiresAt: user.emailChangeExpiresAt,
  };
};

const updateEmail = async (args) => {
  const { user, address, tokenHash } = await findEmailChange(args);
  const hashField =
    address === "current"
      ? "emailChangeOldTokenHash"
      : "emailChangeNewTokenHash";
  const confirmedField =
    address === "current"
      ? "emailChangeOldConfirmed"
      : "emailChangeNewConfirmed";
  const otherConfirmed =
    address === "current"
      ? "emailChangeNewConfirmed"
      : "emailChangeOldConfirmed";
  // MongoDB evaluates the other confirmation against the current document at
  // the moment of the write, so simultaneous confirmations cannot lose a step.
  const complete = { $eq: [`$${otherConfirmed}`, true] };
  const updates = Object.fromEntries(
    [...Object.keys(emailChangeFields), ...Object.keys(resetTokenFields)].map(
      (field) => [field, { $cond: [complete, "$$REMOVE", `$${field}`] }]
    )
  );
  updates[hashField] = "$$REMOVE";
  updates[confirmedField] = { $cond: [complete, "$$REMOVE", true] };
  updates.email = { $cond: [complete, "$pendingEmail", "$email"] };
  updates.tokenVersion = {
    $cond: [
      complete,
      { $add: [{ $ifNull: ["$tokenVersion", 0] }, 1] },
      { $ifNull: ["$tokenVersion", 0] },
    ],
  };
  let updated;
  try {
    updated = await User.findOneAndUpdate(
      {
        _id: args.userId,
        password: user.password,
        emailChangeRequestId: user.emailChangeRequestId,
        pendingEmail: user.pendingEmail,
        emailChangeExpiresAt: { $gt: new Date() },
        emailChangeTokenVersion: args.tokenVersion,
        [hashField]: tokenHash,
        $expr: {
          $and: [
            versionMatches(args.tokenVersion),
            { $eq: ["$email", { $literal: user.email }] },
          ],
        },
      },
      [{ $set: updates }],
      { new: true }
    ).select("+pendingEmail");
  } catch (error) {
    if (error.code === 11000)
      throw new ConflictError(CONFLICT_UPDATE_EMAIL_ERROR_MSG);
    throw error;
  }
  if (!updated) throw invalidLink();
  return {
    completed: updated.pendingEmail === undefined,
    confirmedAddress: address,
  };
};

module.exports = { requestEmailUpdate, validateEmailChangeLink, updateEmail };
