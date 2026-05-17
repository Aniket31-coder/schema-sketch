import { tokenize } from "../parser/tokenize";
import { parse } from "../parser/parse";
import { emit } from "./index";
import type { EmitOptions } from "./types";


const postgres = (source: string, naming: EmitOptions["naming"] = "snake_case") =>
  emit(parse(tokenize(source)), { dialect: "postgres", naming });

describe("postgres emitter", () => {

  it("emits a single entity with native boolean and uuid", () => {
    const sql = postgres(`erDiagram
USER {
  uuid   id        [PK]
  string email     [UK]
  bool   is_active
}`);
    expect(sql).toMatchSnapshot();
  });

  it("uses INTEGER and BIGINT instead of NUMBER", () => {
    const sql = postgres(`erDiagram
COUNTER {
  int    small_id   [PK]
  bigint big_id
}`);
    expect(sql).toContain("INTEGER");
    expect(sql).toContain("BIGINT");
    expect(sql).not.toContain("NUMBER");
  });

  it("emits a one-to-many relationship", () => {
    const sql = postgres(`erDiagram
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

  it("quotes 'order' as a reserved word", () => {
    const sql = postgres(`erDiagram
ORDER {
  int id [PK]
}`);
    expect(sql).toContain('"order"');
  });

  it("emits a many-to-many relationship as a join table", () => {
    const sql = postgres(`erDiagram
USER {
  int id [PK]
}
ROLE {
  int id [PK]
}
USER }o--o{ ROLE`);
    expect(sql).toMatchSnapshot();
  });
});
