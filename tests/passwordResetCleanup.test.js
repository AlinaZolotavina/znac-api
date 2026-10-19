jest.mock("../models/user", () => ({ updateMany: jest.fn() }));
const User = require("../models/user");
const {
  startPasswordResetCleanup,
} = require("../services/passwordResetCleanup");

beforeEach(() => {
  jest.useFakeTimers();
  User.updateMany.mockReset().mockResolvedValue({ modifiedCount: 0 });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test("cleans at startup and every five minutes, and stops on shutdown", async () => {
  const stop = await startPasswordResetCleanup();
  expect(User.updateMany).toHaveBeenCalledTimes(1);
  await jest.advanceTimersByTimeAsync(5 * 60 * 1000);
  expect(User.updateMany).toHaveBeenCalledTimes(2);
  stop();
  await jest.advanceTimersByTimeAsync(10 * 60 * 1000);
  expect(User.updateMany).toHaveBeenCalledTimes(2);
});

test("a cleanup failure is retried without leaking the error contents", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  User.updateMany.mockRejectedValueOnce(
    new Error("private-database-connection")
  );
  const stop = await startPasswordResetCleanup();
  expect(log).toHaveBeenCalledWith(
    "Password reset cleanup failed; will retry in five minutes"
  );
  await jest.advanceTimersByTimeAsync(5 * 60 * 1000);
  expect(User.updateMany).toHaveBeenCalledTimes(2);
  stop();
});

test("does not start overlapping cleanups", async () => {
  let finish;
  User.updateMany.mockImplementationOnce(
    () =>
      new Promise((resolve) => {
        finish = resolve;
      })
  );
  const starting = startPasswordResetCleanup();
  await jest.advanceTimersByTimeAsync(10 * 60 * 1000);
  expect(User.updateMany).toHaveBeenCalledTimes(1);
  finish({ modifiedCount: 0 });
  const stop = await starting;
  stop();
});
