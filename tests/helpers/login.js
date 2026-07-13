const request = require("./requestWithOrigin");
const app = require("../../app");

const login = async ({
  email = "test@test.com",
  password = "12345678",
} = {}) => {
  const response = await request(app).post("/signin").send({ email, password });

  expect(response.status).toBe(200);
  expect(response.headers["set-cookie"]).toBeDefined();

  return response.headers["set-cookie"];
};

module.exports = login;
