const { JWT_RESET_PASSWORD } = process.env;
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

jest.mock("../utils/nodemailerTransporter", () => ({
  sendMail: jest.fn().mockResolvedValue(),
}));

const mongo = require("./helpers/setupMongo");

const transporter = require("../utils/nodemailerTransporter");
const userService = require("../services/userService");

const User = require("../models/user");
const createUser = require("./helpers/createUser");
const createResetToken = require("./helpers/createResetToken");

const {
  AUTHENTICATION_ERROR_MSG,
  RESET_TOKEN_ERROR_MSG,
  NO_RESET_TOKEN_ERROR_MSG,
  PASSWORDS_DO_NOT_MATCH_ERROR_MSG,
  NEW_PASSWORD_SAME_AS_PRIVIOUS_ERROR_MSG,
} = require("../utils/constants"); // ← см. замечание ниже

beforeAll(mongo.connect);

afterEach(async () => {
  jest.clearAllMocks();
  await User.deleteMany({});
});

afterAll(mongo.disconnect);

describe("passwordResetService", () => {
  describe("forgotPassword()", () => {
    test("should create reset token and send email", async () => {
      const user = await createUser();

      await userService.forgotPassword(user.email);

      const saved = await User.findById(user._id);

      expect(saved.resetPasswordLink).toEqual(expect.any(String));

      expect(() =>
        jwt.verify(saved.resetPasswordLink, JWT_RESET_PASSWORD)
      ).not.toThrow();

      expect(transporter.sendMail).toHaveBeenCalledTimes(1);

      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
        })
      );
    });

    test("should normalize email before lookup", async () => {
      const user = await createUser({
        email: "alina@test.com",
      });

      await userService.forgotPassword("   ALINA@TEST.COM   ");

      const saved = await User.findById(user._id);

      expect(saved.resetPasswordLink).toEqual(expect.any(String));

      expect(transporter.sendMail).toHaveBeenCalledTimes(1);
    });

    test("should not throw for unknown email", async () => {
      await expect(
        userService.forgotPassword("unknown@test.com")
      ).resolves.toBeUndefined();

      expect(transporter.sendMail).not.toHaveBeenCalled();

      expect(await User.countDocuments()).toBe(0);
    });

    test("should propagate SMTP error", async () => {
      const user = await createUser();

      transporter.sendMail.mockRejectedValueOnce(new Error("SMTP unavailable"));

      await expect(userService.forgotPassword(user.email)).rejects.toThrow(
        "SMTP unavailable"
      );

      const saved = await User.findById(user._id);

      // токен уже сохранён до попытки отправки письма
      expect(saved.resetPasswordLink).toEqual(expect.any(String));

      expect(transporter.sendMail).toHaveBeenCalledTimes(1);
    });
  });

  describe("resetPassword()", () => {
    test("should reset password successfully", async () => {
      const user = await createUser();

      const token = await createResetToken(user);

      await userService.resetPassword({
        resetPasswordLink: token,
        newPassword: "87654321",
        confirmPassword: "87654321",
      });

      const saved = await User.findById(user._id).select("+password");

      expect(saved.resetPasswordLink).toBe("");

      expect(await bcrypt.compare("87654321", saved.password)).toBe(true);

      expect(await bcrypt.compare("12345678", saved.password)).toBe(false);

      expect(transporter.sendMail).toHaveBeenCalledTimes(1);

      expect(transporter.sendMail).toHaveBeenCalledWith(
        expect.objectContaining({
          to: user.email,
        })
      );
    });

    test("should reject when passwords do not match", async () => {
      const user = await createUser();

      const token = await createResetToken(user);

      await expect(
        userService.resetPassword({
          resetPasswordLink: token,
          newPassword: "87654321",
          confirmPassword: "11111111",
        })
      ).rejects.toThrow(PASSWORDS_DO_NOT_MATCH_ERROR_MSG);

      const saved = await User.findById(user._id).select("+password");

      expect(saved.resetPasswordLink).toBe(token);
      expect(await bcrypt.compare("12345678", saved.password)).toBe(true);

      expect(transporter.sendMail).not.toHaveBeenCalled();
    });

    test("should reject invalid token", async () => {
      await expect(
        userService.resetPassword({
          resetPasswordLink: "invalid-token",
          newPassword: "87654321",
          confirmPassword: "87654321",
        })
      ).rejects.toThrow(RESET_TOKEN_ERROR_MSG);

      expect(transporter.sendMail).not.toHaveBeenCalled();
    });

    test("should reject when reset token is missing", async () => {
      await expect(
        userService.resetPassword({
          resetPasswordLink: "",
          newPassword: "87654321",
          confirmPassword: "87654321",
        })
      ).rejects.toThrow(AUTHENTICATION_ERROR_MSG);
    });

    test("should reject when user does not exist", async () => {
      const user = await createUser();

      const token = await createResetToken(user);

      await User.deleteOne({ _id: user._id });

      await expect(
        userService.resetPassword({
          resetPasswordLink: token,
          newPassword: "87654321",
          confirmPassword: "87654321",
        })
      ).rejects.toThrow(NO_RESET_TOKEN_ERROR_MSG);

      expect(transporter.sendMail).not.toHaveBeenCalled();
    });

    test("should reject when reset token does not match saved token", async () => {
      const user = await createUser();

      const token = await createResetToken(user);

      user.resetPasswordLink = "another-token";
      await user.save();

      await expect(
        userService.resetPassword({
          resetPasswordLink: token,
          newPassword: "87654321",
          confirmPassword: "87654321",
        })
      ).rejects.toThrow(RESET_TOKEN_ERROR_MSG);

      expect(transporter.sendMail).not.toHaveBeenCalled();
    });

    test("should reject when new password is the same", async () => {
      const user = await createUser();

      const token = await createResetToken(user);

      await expect(
        userService.resetPassword({
          resetPasswordLink: token,
          newPassword: "12345678",
          confirmPassword: "12345678",
        })
      ).rejects.toThrow(NEW_PASSWORD_SAME_AS_PRIVIOUS_ERROR_MSG);

      expect(transporter.sendMail).not.toHaveBeenCalled();
    });

    test("should reset password even if notification email fails", async () => {
      const user = await createUser();

      const token = await createResetToken(user);

      transporter.sendMail.mockRejectedValueOnce(new Error("SMTP unavailable"));

      await expect(
        userService.resetPassword({
          resetPasswordLink: token,
          newPassword: "87654321",
          confirmPassword: "87654321",
        })
      ).resolves.toBeUndefined();

      const saved = await User.findById(user._id).select("+password");

      expect(await bcrypt.compare("87654321", saved.password)).toBe(true);
      expect(await bcrypt.compare("12345678", saved.password)).toBe(false);

      expect(saved.resetPasswordLink).toBe("");

      expect(transporter.sendMail).toHaveBeenCalledTimes(1);
    });
  });
});
