jest.mock("../utils/nodemailerTransporter", () => ({
  sendMail: jest.fn().mockResolvedValue(),
}));

const mongo = require("./helpers/setupMongo");

const transporter = require("../utils/nodemailerTransporter");
const userService = require("../services/userService");

const User = require("../models/user");
const createUser = require("./helpers/createUser");
const createUpdateEmailToken = require("./helpers/createUpdateEmailToken");

const {
  USER_NOT_FOUND_ERROR_MSG,
  AUTHENTICATION_ERROR_MSG,
  RESET_TOKEN_ERROR_MSG,
  CONFLICT_UPDATE_EMAIL_ERROR_MSG,
} = require("../utils/constants"); // ← см. замечание ниже

beforeAll(mongo.connect);

afterEach(async () => {
  jest.clearAllMocks();
  await User.deleteMany({});
});

afterAll(mongo.disconnect);

describe("email update", () => {
  describe("requestEmailUpdate", () => {
    test("should save update token and send two emails", async () => {
      const user = await createUser();

      await userService.requestEmailUpdate({
        userId: user._id,
        newEmail: "new@test.com",
      });

      const saved = await User.findById(user._id);

      expect(saved.updateEmailLink).toEqual(expect.any(String));

      expect(transporter.sendMail).toHaveBeenCalledTimes(2);

      expect(transporter.sendMail).toHaveBeenNthCalledWith(
        1,
        expect.objectContaining({
          to: user.email,
        })
      );

      expect(transporter.sendMail).toHaveBeenNthCalledWith(
        2,
        expect.objectContaining({
          to: "new@test.com",
        })
      );
    });

    test("should reject when user does not exist", async () => {
      const user = await createUser();

      await User.deleteOne({
        _id: user._id,
      });

      await expect(
        userService.requestEmailUpdate({
          userId: user._id,
          newEmail: "new@test.com",
        })
      ).rejects.toThrow(USER_NOT_FOUND_ERROR_MSG);

      expect(transporter.sendMail).not.toHaveBeenCalled();
    });

    test("should reject same email", async () => {
      const user = await createUser();

      await expect(
        userService.requestEmailUpdate({
          userId: user._id,
          newEmail: user.email,
        })
      ).rejects.toThrow(CONFLICT_UPDATE_EMAIL_ERROR_MSG);

      expect(transporter.sendMail).not.toHaveBeenCalled();
    });

    test("should propagate SMTP error", async () => {
      const user = await createUser();

      transporter.sendMail.mockRejectedValueOnce(new Error("SMTP unavailable"));

      await expect(
        userService.requestEmailUpdate({
          userId: user._id,
          newEmail: "new@test.com",
        })
      ).rejects.toThrow("SMTP unavailable");
    });
  });

  describe("updateEmail()", () => {
    test("should update email successfully", async () => {
      const user = await createUser();

      const token = await createUpdateEmailToken(user, "new@test.com");

      const updated = await userService.updateEmail(token);

      expect(updated.email).toBe("new@test.com");

      const saved = await User.findById(user._id);

      expect(saved.email).toBe("new@test.com");
      expect(saved.updateEmailLink).toBe("");
    });

    test("should reject without token", async () => {
      await expect(userService.updateEmail()).rejects.toThrow(
        AUTHENTICATION_ERROR_MSG
      );
    });

    test("should reject invalid token", async () => {
      await expect(userService.updateEmail("invalid-token")).rejects.toThrow(
        RESET_TOKEN_ERROR_MSG
      );
    });

    test("should reject when user does not exist", async () => {
      const user = await createUser();

      const token = await createUpdateEmailToken(user, "new@test.com");

      await User.deleteOne({
        _id: user._id,
      });

      await expect(userService.updateEmail(token)).rejects.toThrow(
        USER_NOT_FOUND_ERROR_MSG
      );
    });

    test("should reject when token does not match saved token", async () => {
      const user = await createUser();

      const token = await createUpdateEmailToken(user, "new@test.com");

      user.updateEmailLink = "another-token";
      await user.save();

      await expect(userService.updateEmail(token)).rejects.toThrow(
        RESET_TOKEN_ERROR_MSG
      );
    });

    test("should reject when email already exists", async () => {
      const user = await createUser();

      await createUser({
        email: "existing@test.com",
      });

      const token = await createUpdateEmailToken(user, "existing@test.com");

      await expect(userService.updateEmail(token)).rejects.toThrow(
        CONFLICT_UPDATE_EMAIL_ERROR_MSG
      );
    });
  });
});
