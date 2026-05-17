import { tokenize } from "./tokenize";
import { ParseError } from "./errors";


describe("tokenize", () => {
  it("emits ER_DIAGRAM for the opening keyword", () => {
    const tokens = tokenize("erDiagram");
    expect(tokens[0].type).toBe("ER_DIAGRAM");
    expect(tokens[0].value).toBe("erDiagram");
    expect(tokens[1].type).toBe("EOF");
  });
  it("distinguishes erDiagram from a regular identifier", () => {
    // 'erDiagrams' (plural) should be an IDENT, not the keyword
    const tokens = tokenize("erDiagrams");
    expect(tokens[0].type).toBe("IDENT");
  });
  it("tokenizes a simple entity declaration", () => {
    const tokens = tokenize("erDiagram\nCUSTOMER {\n  string name\n}");
    const types = tokens.map((t) => t.type);
    expect(types).toEqual([
      "ER_DIAGRAM",
      "NEWLINE",
      "IDENT",      // CUSTOMER
      "LBRACE",
      "NEWLINE",
      "IDENT",      // string
      "IDENT",      // name
      "NEWLINE",
      "RBRACE",
      "EOF",
    ]);
  });
  it("handles a one-to-many cardinality", () => {
    const tokens = tokenize("CUSTOMER ||--o{ ORDER");
    const types = tokens.map((t) => t.type);
    expect(types).toEqual(["IDENT", "CARDINALITY", "IDENT", "EOF"]);
    expect(tokens[1].value).toBe("||--o{");
  });
  it("handles all five cardinality variants", () => {
    const variants = ["||--||", "||--o{", "}o--||", "}o--o{", "||--|{"];
    for (const v of variants) {
      const tokens = tokenize(`A ${v} B`);
      expect(tokens[1].type).toBe("CARDINALITY");
      expect(tokens[1].value).toBe(v);
    }
  });
  it("captures string literals", () => {
    const tokens = tokenize('"a comment"');
    expect(tokens[0].type).toBe("STRING");
    expect(tokens[0].value).toBe("a comment");
  });
  it("tracks line and column numbers", () => {
    // Two lines, identifier on the second line at column 3
    const tokens = tokenize("erDiagram\n  CUSTOMER");
    const customer = tokens.find((t) => t.value === "CUSTOMER")!;
    expect(customer.line).toBe(2);
    expect(customer.column).toBe(3);
  });
  it("skips %% comments to end of line", () => {
    const tokens = tokenize("CUSTOMER %% the customer entity\nORDER");
    // No token for the comment; just CUSTOMER, NEWLINE, ORDER, EOF
    const types = tokens.map((t) => t.type);
    expect(types).toEqual(["IDENT", "NEWLINE", "IDENT", "EOF"]);
  });
  it("throws ParseError for unterminated strings", () => {
    expect(() => tokenize('"unterminated')).toThrow(ParseError);
  });
  it("throws ParseError for unexpected characters with location", () => {
    try {
      tokenize("erDiagram\n  CUSTOMER@");
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ParseError);
      expect((e as ParseError).line).toBe(2);
      // '@' is at column 11 (after two spaces and "CUSTOMER")
      expect((e as ParseError).column).toBe(11);
    }
  });
});