const normalizeHashtagName = require("../../utils/normalizeHashtagName");

describe("normalizeHashtagName", () => {
  test("should trim whitespace", () => {
    expect(normalizeHashtagName("  Node  ")).toBe("node");
  });

  test("should lowercase value", () => {
    expect(normalizeHashtagName("ReAcT")).toBe("react");
  });

  test("should return empty string for undefined", () => {
    expect(normalizeHashtagName(undefined)).toBe("");
  });

  test("should return empty string for null", () => {
    expect(normalizeHashtagName(null)).toBe("");
  });

  test("should keep valid hashtag unchanged", () => {
    expect(normalizeHashtagName("node")).toBe("node");
  });
});
