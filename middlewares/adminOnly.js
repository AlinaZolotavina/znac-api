const ForbiddenError = require("../errors/forbidden-err");

const adminOnly = (req, res, next) => {
  if (req.user?.role !== "admin") {
    return next(new ForbiddenError("Forbidden"));
  }

  return next();
};

module.exports = adminOnly;
