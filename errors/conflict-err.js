class ConflictError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 409;
    this.code = "CONFLICT";
  }
}

module.exports = ConflictError;
