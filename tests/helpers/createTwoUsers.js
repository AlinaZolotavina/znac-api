const createUser = require("./createUser");

const createTwoUsers = async () => {
  const owner = await createUser();

  const stranger = await createUser({
    email: "stranger@test.com",
  });

  return { owner, stranger };
};

module.exports = createTwoUsers;
