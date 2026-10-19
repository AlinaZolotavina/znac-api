const { redactSecrets, redactText } = require("../utils/redactSecrets");

test("redacts URL tokens, cookies, authorization and nested passwords", () => {
  const token = "a".repeat(64);
  const jwt = "eyJhbGciOiJIUzI1NiJ9.eyJpZCI6MX0.signature";
  const record = {
    message: `HTTP PUT /reset-password/${token}`,
    meta: {
      req: {
        url: `/reset-password/${token}`,
        originalUrl: `/api/reset-password/${token}?extra=1`,
        headers: {
          cookie: `jwt=${jwt}`,
          authorization: `Bearer ${jwt}`,
          referer: `https://znac.org/reset-password/${token}`,
        },
        body: {
          currentPassword: "current-secret",
          emailChangeOldTokenHash: token,
          emailChangeNewTokenHash: token,
          newPassword: "new-secret",
          confirmPassword: "new-secret",
          token,
        },
      },
    },
    stack: `Error at /profile/update-email/${jwt}`,
  };
  const result = redactSecrets(record);
  const serialized = JSON.stringify(result);
  expect(serialized).not.toContain(token);
  expect(serialized).not.toContain(jwt);
  expect(serialized).not.toContain("new-secret");
  expect(serialized).not.toContain("current-secret");
  expect(result.message).toBe("HTTP PUT /reset-password/[REDACTED]");
  expect(record.meta.req.body.newPassword).toBe("new-secret");
  expect(redactText("GET /photos/123")).toBe("GET /photos/123");
});

test("preserves Winston symbol properties through redaction", () => {
  const level = Symbol.for("level");
  const result = redactSecrets({ [level]: "info", message: "safe" });
  expect(result[level]).toBe("info");
});

test("handles circular error metadata without preventing logging", () => {
  const metadata = { password: "secret" };
  metadata.cause = metadata;
  expect(redactSecrets(metadata)).toEqual({
    password: "[REDACTED]",
    cause: "[Circular]",
  });
});
