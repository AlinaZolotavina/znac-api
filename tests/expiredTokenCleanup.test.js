jest.mock("../models/user", () => ({ updateMany: jest.fn() }));
const User = require("../models/user");
const { startExpiredTokenCleanup } = require("../services/expiredTokenCleanup");

beforeEach(() => {
  jest.useFakeTimers();
  User.updateMany.mockReset().mockResolvedValue({ modifiedCount: 0 });
});
afterEach(() => {
  jest.useRealTimers();
  jest.restoreAllMocks();
});

test("cleans at startup and every five minutes, and stops on shutdown", async () => {
  const stop = await startExpiredTokenCleanup();
  expect(User.updateMany).toHaveBeenCalledTimes(2);
  await jest.advanceTimersByTimeAsync(5 * 60 * 1000);
  expect(User.updateMany).toHaveBeenCalledTimes(4);
  stop();
  await jest.advanceTimersByTimeAsync(10 * 60 * 1000);
  expect(User.updateMany).toHaveBeenCalledTimes(4);
});

test("a cleanup failure is retried without leaking the error contents", async () => {
  const log = jest.spyOn(console, "error").mockImplementation(() => {});
  User.updateMany.mockRejectedValueOnce(
    new Error("private-database-connection")
  );
  const stop = await startExpiredTokenCleanup();
  expect(log).toHaveBeenCalledWith(
    "Expired token cleanup failed; will retry in five minutes"
  );
  await jest.advanceTimersByTimeAsync(5 * 60 * 1000);
  expect(User.updateMany).toHaveBeenCalledTimes(4);
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
  const starting = startExpiredTokenCleanup();
  await jest.advanceTimersByTimeAsync(10 * 60 * 1000);
  expect(User.updateMany).toHaveBeenCalledTimes(2);
  finish({ modifiedCount: 0 });
  const stop = await starting;
  stop();
});
