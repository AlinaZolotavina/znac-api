const normalizeHashtags = require("../../utils/normalizeHashtags");

describe("normalizeHashtags", () => {
  test("should return empty array for undefined", () => {
    expect(normalizeHashtags()).toEqual([]);
  });

  test("should return empty array for null", () => {
    expect(normalizeHashtags(null)).toEqual([]);
  });

  test("should return empty array for empty string", () => {
    expect(normalizeHashtags("")).toEqual([]);
  });

  test("should normalize string hashtags", () => {
    expect(normalizeHashtags("Node   Express   NODE")).toEqual([
      "node",
      "express",
    ]);
  });

  test("should normalize array hashtags", () => {
    expect(normalizeHashtags(["Node", "Express NODE"])).toEqual([
      "node",
      "express",
    ]);
  });

  test("should remove duplicates", () => {
    expect(normalizeHashtags("node node express node")).toEqual([
      "node",
      "express",
    ]);
  });

  test("should trim whitespace", () => {
    expect(normalizeHashtags("   node    express   ")).toEqual([
      "node",
      "express",
    ]);
  });

  test("should remove empty values", () => {
    expect(normalizeHashtags(["", "   ", "Node"])).toEqual(["node"]);
  });
});
