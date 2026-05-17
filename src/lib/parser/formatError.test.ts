import { ParseError } from "./errors";
import { formatError } from "./formatError";

describe("formatError", () => {

    it("includes the error message", () => {
    const err = new ParseError("oops", 1, 1);
    const out = formatError(err, "hello");
    expect(out).toContain("oops");
  });

  it("shows the offending line and a caret", () => {
    const source = "erDiagram\nCUSTOMER {\n  int id [SUPERKEY]\n}";
    const err = new ParseError("unknown constraint 'SUPERKEY'", 3, 11);
    const out = formatError(err, source, { pointerLength: 8 });
    expect(out).toContain("int id [SUPERKEY]");
    expect(out).toContain("^^^^^^^^"); // 8 carets
  });

  it("places the caret at the right column", () => {
    const source = "abc def";
    const err = new ParseError("oops", 1, 5);
    const out = formatError(err, source);
    // The caret line should have 4 spaces of indent (column 5 is 1-based → 4 zero-indexed)
    const lines = out.split("\n");
    const caretLine = lines[lines.length - 1];
    expect(caretLine).toBe("        ^"); // 4 spaces of "    " prefix + 4 spaces of indent
  });

  it("handles errors past end of file gracefully", () => {
    const source = "abc";
    const err = new ParseError("unexpected end", 5, 1);
    // No line 5 exists — should not throw
    expect(() => formatError(err, source)).not.toThrow();
  });
});