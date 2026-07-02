const bcrypt = require("bcryptjs");

const mongo = require("./helpers/setupMongo");

const userService = require("../services/userService");

const User = require("../models/user");
const createUser = require("./helpers/createUser");

const {
  USER_NOT_FOUND_ERROR_MSG,
  WRONG_PASSWORD_ERROR_MSG,
} = require("../utils/constants");

beforeAll(mongo.connect);

afterEach(async () => {
  await User.deleteMany({});
});

afterAll(mongo.disconnect);

describe("updatePassword()", () => {
  test("should update password successfully", async () => {
    const user = await createUser();

    await userService.updatePassword({
      userId: user._id,
      oldPassword: "12345678",
      newPassword: "87654321",
    });

    const saved = await User.findById(user._id).select("+password");

    expect(await bcrypt.compare("87654321", saved.password)).toBe(true);
    expect(await bcrypt.compare("12345678", saved.password)).toBe(false);
  });

  test("should reject when user does not exist", async () => {
    const user = await createUser();

    await User.deleteOne({
      _id: user._id,
    });

    await expect(
      userService.updatePassword({
        userId: user._id,
        oldPassword: "12345678",
        newPassword: "87654321",
      })
    ).rejects.toThrow(USER_NOT_FOUND_ERROR_MSG);
  });

  test("should reject when old password is incorrect", async () => {
    const user = await createUser();

    await expect(
      userService.updatePassword({
        userId: user._id,
        oldPassword: "wrong-password",
        newPassword: "87654321",
      })
    ).rejects.toThrow(WRONG_PASSWORD_ERROR_MSG);

    const saved = await User.findById(user._id).select("+password");

    expect(await bcrypt.compare("12345678", saved.password)).toBe(true);
    expect(await bcrypt.compare("87654321", saved.password)).toBe(false);
  });
});
