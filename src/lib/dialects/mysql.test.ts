import { tokenize } from "../parser/tokenize";
import { parse } from "../parser/parse";
import { emit } from "./index";
import type { EmitOptions } from "./types";

const mysql = (source: string, naming: EmitOptions["naming"] = "snake_case") =>
  emit(parse(tokenize(source)), { dialect: "mysql", naming });

describe("mysql emitter", () => {

  it("emits a single entity with TINYINT for bool and CHAR(36) for uuid", () => {
    const sql = mysql(`erDiagram
USER {
  uuid   id        [PK]
  string email     [UK]
  bool   is_active
}`);
    expect(sql).toMatchSnapshot();
  });
 
  it("appends ENGINE=InnoDB to CREATE TABLE", () => {
    const sql = mysql(`erDiagram
USER {
  int id [PK]
}`);
    expect(sql).toContain("ENGINE=InnoDB");
  });
 
  it("uses backticks for reserved words", () => {
    const sql = mysql(`erDiagram
ORDER {
  int id [PK]
}`);
    expect(sql).toContain("`order`");
    expect(sql).not.toContain('"order"');
  });
 
 it("emits FKs correctly", () => {
    const sql = mysql(`erDiagram
CUSTOMER {
  int id [PK]
}
ORDER {
  int id [PK]
}
CUSTOMER ||--o{ ORDER`);
    expect(sql).toMatchSnapshot();
  });

  it("emits a many-to-many relationship as a join table", () => {
    const sql = mysql(`erDiagram
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
