class NotFoundError extends Error {
  constructor(message) {
    super(message);
    this.statusCode = 404;
    this.code = "NOT_FOUND";
  }
}

module.exports = NotFoundError;
