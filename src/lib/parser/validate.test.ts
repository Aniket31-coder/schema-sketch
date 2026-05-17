import { tokenize } from "./tokenize";
import { parse } from "./parse";
import { validate } from "./validate";

const v = (source: string) => validate(parse(tokenize(source)));

describe("validate", () => {
  it("returns no errors for a valid schema", () => {
    expect(v(`erDiagram
CUSTOMER {
  int id [PK]
}
ORDER {
  int id [PK]
}
CUSTOMER ||--o{ ORDER`)).toEqual([]);
  });
  it("flags duplicate entity names", () => {
    const errors = v(`erDiagram
CUSTOMER {
  int id [PK]
}
CUSTOMER {
  int id [PK]
}`);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/declared more than once/);
  });
  it("flags relationships to unknown entities", () => {
    const errors = v(`erDiagram
CUSTOMER {
  int id [PK]
}
CUSTOMER ||--o{ ORDER`);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/unknown entity 'ORDER'/);
  });
  it("flags entities with no primary key that are referenced", () => {
    const errors = v(`erDiagram
CUSTOMER {
  string name
}
ORDER {
  int id [PK]
}
CUSTOMER ||--o{ ORDER`);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/no primary key/);
  });
  it("flags the 'to' entity when it has no primary key", () => {
    const errors = v(`erDiagram
CUSTOMER {
  int id [PK]
}
ORDER {
  string status
}
CUSTOMER ||--o{ ORDER`);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/ORDER.*no primary key/);
  });
  it("does NOT flag entities without PK if no relationship references them", () => {
    // A standalone entity with no relationships doesn't need a PK
    expect(v(`erDiagram
LOG {
  string message
}`)).toEqual([]);
  });
  it("flags duplicate attribute names", () => {
    const errors = v(`erDiagram
USER {
  int id [PK]
  string name
  string name
}`);
    expect(errors).toHaveLength(1);
    expect(errors[0].message).toMatch(/duplicate attribute 'name'/);
  });
  it("collects multiple errors at once", () => {
    const errors = v(`erDiagram
A {
  int id
}
A ||--o{ B`);
    // Two problems: A has no PK, AND B isn't declared
    expect(errors.length).toBeGreaterThanOrEqual(2);
  });
});