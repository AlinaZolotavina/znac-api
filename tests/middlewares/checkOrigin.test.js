const checkOrigin = require("../../middlewares/checkOrigin");
const corsOptions = require("../../utils/corsOptions");

const { FORBIDDEN_ORIGIN_ERROR_MSG } = require("../../utils/constants");

const allowedOrigin =
  process.env.CLIENT_URL || [...corsOptions.allowedOrigins][0];

describe("checkOrigin", () => {
  let req;
  let res;
  let next;

  beforeEach(() => {
    req = {
      method: "POST",
      path: "/posts",
      originalUrl: "/posts",
      get: jest.fn(),
    };

    res = {
      status: jest.fn().mockReturnThis(),
      send: jest.fn(),
    };

    next = jest.fn();

    jest.clearAllMocks();
  });

  test.each(["GET", "HEAD", "OPTIONS"])(
    "should allow %s requests",
    (method) => {
      req.method = method;

      checkOrigin(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(req.get).not.toHaveBeenCalled();
    }
  );

  test.each(["POST", "PATCH", "PUT", "DELETE"])(
    "should reject %s requests from unknown origin",
    (method) => {
      req.method = method;
      req.get.mockReturnValue("https://evil.example");

      checkOrigin(req, res, next);

      expect(res.status).toHaveBeenCalledWith(403);
    }
  );

  test("should reject unsafe requests without Origin header", () => {
    req.get.mockReturnValue(undefined);

    checkOrigin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(next).not.toHaveBeenCalled();
  });

  test.each([
    ["POST", "/photos/found"],
    ["PUT", "/photos/507f1f77bcf86cd799439011/views"],
    ["POST", "/hashtags"],
    ["PATCH", "/hashtags"],
    ["POST", "/contact"],
  ])(
    "should allow public %s %s requests without Origin header",
    (method, path) => {
      req.method = method;
      req.path = path;
      req.originalUrl = path;
      req.get.mockReturnValue(undefined);

      checkOrigin(req, res, next);

      expect(next).toHaveBeenCalledWith();
      expect(res.status).not.toHaveBeenCalled();
    }
  );

  test("should allow requests from allowed origin", () => {
    req.get.mockReturnValue(allowedOrigin);

    checkOrigin(req, res, next);

    expect(next).toHaveBeenCalledWith();
  });

  test("should reject requests from unknown origin", () => {
    req.get.mockReturnValue("https://evil.example");

    checkOrigin(req, res, next);

    expect(res.status).toHaveBeenCalledWith(403);

    expect(res.send).toHaveBeenCalledWith({
      message: FORBIDDEN_ORIGIN_ERROR_MSG,
    });

    expect(next).not.toHaveBeenCalled();
  });
});
