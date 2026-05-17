import { tokenize } from "../parser/tokenize";
import { parse } from "../parser/parse";
import { emit } from "./index";
import type { EmitOptions } from "./types";

const oracle = (source: string, naming: EmitOptions["naming"] = "snake_case") =>
  emit(parse(tokenize(source)), { dialect: "oracle", naming });

describe("oracle emitter", () => {

  it("emits a single entity with PK", () => {
    const sql = oracle(`erDiagram
CUSTOMER {
  int    id   [PK]
  string name
}`);
    expect(sql).toMatchSnapshot();
  });

  it("emits PK and UK constraints", () => {
    const sql = oracle(`erDiagram
USER {
  int    id    [PK]
  string email [UK]
  string name
}`);
    expect(sql).toMatchSnapshot();
  });
  
  it("emits a composite primary key", () => {
    const sql = oracle(`erDiagram
USER_ROLE {
  int user_id [PK]
  int role_id [PK]
}`);
    expect(sql).toMatchSnapshot();
  });
  
  it("emits multiple entities with blank lines between", () => {
    const sql = oracle(`erDiagram
CUSTOMER {
  int    id   [PK]
  string name
}
ORDER {
  int  id          [PK]
  int  customer_id
  date placed_at
}`);
    expect(sql).toMatchSnapshot();
  });
  
  it("maps types correctly", () => {
    const sql = oracle(`erDiagram
ALL_TYPES {
  int       a [PK]
  bigint    b
  string    c
  text      d
  decimal   e
  bool      f
  date      g
  timestamp h
  uuid      i
}`);
    expect(sql).toMatchSnapshot();
  });
  
  it("respects PascalCase naming", () => {
    const sql = oracle(`erDiagram
LINE_ITEM {
  int      id          [PK]
  int      order_id
  decimal  unit_price
}`, "PascalCase");
    expect(sql).toMatchSnapshot();
  });
  
  it("aligns column types for readability", () => {
    const sql = oracle(`erDiagram
USER {
  int    id    [PK]
  string a
  string longer_name
  text   x
}`);
    // The alignment makes types start at the same column —
    // we just snapshot it and trust the eyeball check.
    expect(sql).toMatchSnapshot();
  });
  
  it("passes through unknown types uppercased", () => {
    const sql = oracle(`erDiagram
WEIRD {
  customtype col [PK]
}`);
    expect(sql).toContain("CUSTOMTYPE");
  });
  
  it("handles an entity with no constraints (no PK)", () => {
    // Standalone log table — no PK, no FK, no UK
    const sql = oracle(`erDiagram
LOG {
  string message
  date   created_at
}`);
    expect(sql).toMatchSnapshot();
    // Make sure there's no PRIMARY KEY constraint line
    expect(sql).not.toContain("PRIMARY KEY");
  });
});

  it("emits a one-to-many relationship with FK and ALTER TABLE", () => {
    const sql = oracle(`erDiagram
CUSTOMER {
  int    id   [PK]
  string name
}
ORDER {
  int  id        [PK]
  date placed_at
}
CUSTOMER ||--o{ ORDER : "places"`);
    expect(sql).toMatchSnapshot();
  });
  
  it("makes FK nullable when relationship is optional", () => {
    // }o on the parent side means optional — FK should allow NULL
    const sql = oracle(`erDiagram
CUSTOMER {
  int id [PK]
}
ORDER {
  int id [PK]
}
ORDER }o--o| CUSTOMER`);
    // 'o|' on the right side → CUSTOMER optional → customer_id nullable
    expect(sql).toMatchSnapshot();
  });
  
  it("emits a many-to-many relationship as a join table", () => {
    const sql = oracle(`erDiagram
USER {
  int id [PK]
}
ROLE {
  int id [PK]
}
USER }o--o{ ROLE`);
    expect(sql).toMatchSnapshot();
  });
  
  it("quotes reserved words", () => {
    const sql = oracle(`erDiagram
ORDER {
  int id [PK]
}`);
    expect(sql).toContain('"order"');
  });
  
  it("handles multiple FKs on one table", () => {
    const sql = oracle(`erDiagram
CUSTOMER {
  int id [PK]
}
ADDRESS {
  int id [PK]
}
ORDER {
  int id [PK]
}
CUSTOMER ||--o{ ORDER
ADDRESS  ||--o{ ORDER`);
    expect(sql).toMatchSnapshot();
  });
  
  it("emits FKs in the same order as they were declared", () => {
    const sql = oracle(`erDiagram
A {
  int id [PK]
}
B {
  int id [PK]
}
A ||--o{ B`);
    // Expect CREATE TABLE A, CREATE TABLE B, then ALTER for the FK
    const tableAIndex = sql.indexOf("CREATE TABLE a");
    const tableBIndex = sql.indexOf("CREATE TABLE b");
    const alterIndex = sql.indexOf("ALTER TABLE b");
    expect(tableAIndex).toBeLessThan(tableBIndex);
    expect(tableBIndex).toBeLessThan(alterIndex);
  });
