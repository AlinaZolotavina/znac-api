const { validateHashtag } = require("../../utils/validateHashtag");

describe("validateHashtag", () => {
  test.each(["node", "react_18", "тест", "Ёлка_2026"])(
    "should allow valid hashtag %s",
    (hashtag) => {
      expect(validateHashtag(hashtag)).toBe(true);
    }
  );

  test.each(["", "   ", "node-js", "node.js", "node js", "#node"])(
    "should reject invalid hashtag %s",
    (hashtag) => {
      expect(validateHashtag(hashtag)).toBe(false);
    }
  );
});
