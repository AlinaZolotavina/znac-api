const expectAuthCookie = (cookie) => {
  expect(cookie).toContain("jwt=");
  expect(cookie).toContain("HttpOnly");
  expect(cookie).toContain("SameSite=Lax");

  if (process.env.NODE_ENV === "production") {
    expect(cookie).toContain("Secure");
  } else {
    expect(cookie).not.toContain("Secure");
  }
};

module.exports = expectAuthCookie;
