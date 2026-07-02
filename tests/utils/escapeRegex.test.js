const escapeRegex = require("../../utils/escapeRegex");

describe("escapeRegex", () => {
  test("should return plain string unchanged", () => {
    expect(escapeRegex("node")).toBe("node");
  });

  test("should escape regex special characters", () => {
    expect(escapeRegex(".*+?^${}()|[]\\")).toBe(
      "\\.\\*\\+\\?\\^\\$\\{\\}\\(\\)\\|\\[\\]\\\\"
    );
  });

  test("should escape dots", () => {
    expect(escapeRegex("node.js")).toBe("node\\.js");
  });

  test("should escape parentheses", () => {
    expect(escapeRegex("(test)")).toBe("\\(test\\)");
  });

  test("should escape square brackets", () => {
    expect(escapeRegex("[abc]")).toBe("\\[abc\\]");
  });
});
