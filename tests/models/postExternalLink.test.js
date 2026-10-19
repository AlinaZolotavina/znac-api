const mongoose = require("mongoose");
const Post = require("../../models/post");

const makePost = (fields = {}) =>
  new Post({
    owner: new mongoose.Types.ObjectId(),
    theme: "Backend",
    icon: "link",
    title: "External article",
    text: "Post text",
    ...fields,
  });

describe("Post external link model validation", () => {
  test.each([
    "javascript:alert(1)",
    "data:text/html,hello",
    "file:///etc/passwd",
    "not a url",
  ])("rejects invalid externalLink %s when bypassing the API", async (url) => {
    const post = makePost({ externalLink: url });

    await expect(post.validate()).rejects.toThrow("externalLink");
  });

  test("enforces the same 40 character text limit as the API", async () => {
    const post = makePost({
      externalLink: "https://example.com/",
      externalLinkButtonText: "a".repeat(41),
    });

    await expect(post.validate()).rejects.toThrow("externalLinkButtonText");
  });

  test.each([undefined, null, ""])(
    "removes orphaned text when externalLink is %s",
    async (externalLink) => {
      const post = makePost({
        externalLink,
        externalLinkButtonText: "Read more",
      });
      await post.validate();

      expect(post.toObject()).not.toHaveProperty("externalLink");
      expect(post.toObject()).not.toHaveProperty("externalLinkButtonText");
    }
  );

  test.each([undefined, null, "", "   "])(
    "removes empty custom text %s while preserving the link",
    async (externalLinkButtonText) => {
      const post = makePost({
        externalLink: "https://example.com/",
        externalLinkButtonText,
      });
      await post.validate();

      expect(post.externalLink).toBe("https://example.com/");
      expect(post.toObject()).not.toHaveProperty("externalLinkButtonText");
    }
  );
});
