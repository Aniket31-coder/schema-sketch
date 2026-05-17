import { tokenize } from "./tokenize";
import { parse } from "./parse";
import { ParseError } from "./errors";


const p = (source: string) => parse(tokenize(source));
describe("parse", () => {
  it("parses an empty erDiagram", () => {
    const schema = p("erDiagram");
    expect(schema.entities).toEqual([]);
    expect(schema.relationships).toEqual([]);
  });
  it("parses a single entity with no attributes", () => {
    const schema = p("erDiagram\nCUSTOMER {\n}");
    expect(schema.entities).toHaveLength(1);
    expect(schema.entities[0].name).toBe("CUSTOMER");
    expect(schema.entities[0].attributes).toEqual([]);
  });
  it("parses an entity with two attributes", () => {
    const schema = p(`erDiagram
CUSTOMER {
  string name
  string email
}`);
    const e = schema.entities[0];
    expect(e.attributes).toHaveLength(2);
    expect(e.attributes[0]).toMatchObject({ type: "string", name: "name" });
    expect(e.attributes[1]).toMatchObject({ type: "string", name: "email" });
  });
  it("parses attributes with constraints", () => {
    const schema = p(`erDiagram
CUSTOMER {
  int id [PK]
  string email [UK]
}`);
    expect(schema.entities[0].attributes[0].constraints).toEqual(["PK"]);
    expect(schema.entities[0].attributes[1].constraints).toEqual(["UK"]);
  });
  it("parses multiple constraints on one attribute", () => {
    const schema = p(`erDiagram
ORDER {
  int customer_id [FK] [UK]
}`);
    expect(schema.entities[0].attributes[0].constraints).toEqual(["FK", "UK"]);
  });
  it("parses attribute comments", () => {
    const schema = p(`erDiagram
USER {
  string email "primary login"
}`);
    expect(schema.entities[0].attributes[0].comment).toBe("primary login");
  });
  it("parses multiple entities", () => {
    const schema = p(`erDiagram
CUSTOMER {
  int id [PK]
}
ORDER {
  int id [PK]
}`);
    expect(schema.entities).toHaveLength(2);
    expect(schema.entities.map((e) => e.name)).toEqual(["CUSTOMER", "ORDER"]);
  });
  it("tolerates blank lines anywhere", () => {
    const schema = p(`
erDiagram

CUSTOMER {
  string name
}
`);
    expect(schema.entities[0].attributes).toHaveLength(1);
  });
  it("rejects input that doesn't start with erDiagram", () => {
    expect(() => p("CUSTOMER {}")).toThrow(ParseError);
  });
  it("rejects unknown constraints", () => {
    expect(() => p(`erDiagram
CUSTOMER {
  int id [SUPERKEY]
}`)).toThrow(/unknown constraint/);
  });
  it("rejects unterminated entity body", () => {
    expect(() => p(`erDiagram
CUSTOMER {
  string name`)).toThrow(/unterminated entity body/);
  });
  it("reports the line number of errors", () => {
    try {
      p(`erDiagram
CUSTOMER {
  int id [BADKEY]
}`);
      throw new Error("should have thrown");
    } catch (e) {
      expect(e).toBeInstanceOf(ParseError);
      expect((e as ParseError).line).toBe(3);
    }
  });
});