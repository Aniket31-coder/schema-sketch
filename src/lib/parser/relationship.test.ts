import { tokenize } from "./tokenize";
import { parse } from "./parse";
import { ParseError } from "./errors";


const p = (source: string) => parse(tokenize(source));

describe("parse relationships", () => {
  
  it("parses a one-to-many relationship", () => {
    const schema = p(`erDiagram
CUSTOMER ||--o{ ORDER`);
    expect(schema.relationships).toHaveLength(1);
    expect(schema.relationships[0]).toMatchObject({
      from: "CUSTOMER",
      to: "ORDER",
      fromSide: { many: false, mandatory: true },
      toSide: { many: true, mandatory: false },
    });
  });
 
  it("parses a relationship with a label", () => {
    const schema = p(`erDiagram
CUSTOMER ||--o{ ORDER : "places"`);
    expect(schema.relationships[0].label).toBe("places");
  });
  
  it("parses a one-to-one mandatory relationship", () => {
    const schema = p(`erDiagram
USER ||--|| PROFILE`);
    expect(schema.relationships[0]).toMatchObject({
      fromSide: { many: false, mandatory: true },
      toSide: { many: false, mandatory: true },
    });
  });
  
  it("parses a many-to-many relationship", () => {
    const schema = p(`erDiagram
USER }o--o{ ROLE`);
    expect(schema.relationships[0]).toMatchObject({
      fromSide: { many: true, mandatory: false },
      toSide: { many: true, mandatory: false },
    });
  });
  
  it("parses entities and relationships in the same schema", () => {
    const schema = p(`erDiagram
CUSTOMER {
  int id [PK]
}
ORDER {
  int id [PK]
}
CUSTOMER ||--o{ ORDER : "places"`);
    expect(schema.entities).toHaveLength(2);
    expect(schema.relationships).toHaveLength(1);
    expect(schema.relationships[0].from).toBe("CUSTOMER");
    expect(schema.relationships[0].to).toBe("ORDER");
  });
  
  it("handles relationships before entity declarations", () => {
    const schema = p(`erDiagram
CUSTOMER ||--o{ ORDER
CUSTOMER {
  int id [PK]
}`);
    expect(schema.entities).toHaveLength(1);
    expect(schema.relationships).toHaveLength(1);
  });
  
  it("captures relationship line numbers", () => {
    const schema = p(`erDiagram
CUSTOMER ||--o{ ORDER`);
    expect(schema.relationships[0].line).toBe(2);
  });
  
  it("rejects a relationship missing the right-hand entity", () => {
    expect(() => p(`erDiagram
CUSTOMER ||--o{`)).toThrow(ParseError);
  });
  
  it("rejects a missing colon-label combination", () => {
    // ':' present but no string after — should be a clear error
    expect(() => p(`erDiagram
CUSTOMER ||--o{ ORDER :`)).toThrow(/relationship label/);
  });
  
  it("parses multiple relationships", () => {
    const schema = p(`erDiagram
A ||--o{ B
A ||--o{ C
B }o--o{ C`);
    expect(schema.relationships).toHaveLength(3);
    expect(schema.relationships.map((r) => r.to)).toEqual(["B", "C", "C"]);
  });
});