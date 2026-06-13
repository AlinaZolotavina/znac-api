class ForbiddenError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 403;
    this.code = "FORBIDDEN";
  }
}

module.exports = ForbiddenError;
