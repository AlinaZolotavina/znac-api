const getPagination = require("../../utils/pagination");

describe("getPagination", () => {
  test("should return default values", () => {
    expect(
      getPagination({
        query: {},
      })
    ).toEqual({
      page: 1,
      limit: 20,
      skip: 0,
    });
  });

  test("should calculate pagination", () => {
    expect(
      getPagination({
        query: {
          page: "3",
          limit: "10",
        },
      })
    ).toEqual({
      page: 3,
      limit: 10,
      skip: 20,
    });
  });

  test("should not allow page less than 1", () => {
    expect(
      getPagination({
        query: {
          page: "-5",
        },
      }).page
    ).toBe(1);
  });

  test("should not allow limit less than 1", () => {
    expect(
      getPagination({
        query: {
          limit: "-10",
        },
      }).limit
    ).toBe(1);
  });

  test("should limit maximum page size", () => {
    expect(
      getPagination({
        query: {
          limit: "500",
        },
      }).limit
    ).toBe(100);
  });

  test("should use defaults for invalid values", () => {
    expect(
      getPagination({
        query: {
          page: "abc",
          limit: "xyz",
        },
      })
    ).toEqual({
      page: 1,
      limit: 20,
      skip: 0,
    });
  });
});
