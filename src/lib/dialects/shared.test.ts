import { rename, indent, padRight, maxLen } from "./shared";

describe("rename", () => {

  it("lowercases simple identifiers for snake_case", () => {
    expect(rename("CUSTOMER", "snake_case")).toBe("customer");
  });

  it("preserves underscores for snake_case", () => {
    expect(rename("LINE_ITEM", "snake_case")).toBe("line_item");
  });

  it("converts camelCase to snake_case", () => {
    expect(rename("userId", "snake_case")).toBe("user_id");
    expect(rename("placedAt", "snake_case")).toBe("placed_at");
  });

  it("produces PascalCase from underscore-separated input", () => {
    expect(rename("line_item", "PascalCase")).toBe("LineItem");
    expect(rename("CUSTOMER", "PascalCase")).toBe("Customer");
  });

  it("produces PascalCase from camelCase input", () => {
    expect(rename("userId", "PascalCase")).toBe("UserId");
  });
});


describe("indent", () => {

  it("indents each line by 2 spaces by default", () => {
    expect(indent("a\nb\nc")).toBe("  a\n  b\n  c");
  });

  it("respects the spaces argument", () => {
    expect(indent("a", 4)).toBe("    a");
  });

  it("preserves empty lines without indenting them", () => {
    expect(indent("a\n\nb")).toBe("  a\n\n  b");
  });
});

describe("padRight", () => {

  it("pads to the given width", () => {
    expect(padRight("id", 8)).toBe("id      ");
  });

  it("leaves longer strings unchanged", () => {
    expect(padRight("identifier", 5)).toBe("identifier");
  });
});

describe("maxLen", () => {

  it("returns the longest string's length", () => {
    expect(maxLen(["a", "abc", "ab"])).toBe(3);
  });

  it("returns 0 for empty arrays", () => {
    expect(maxLen([])).toBe(0);
  });
});