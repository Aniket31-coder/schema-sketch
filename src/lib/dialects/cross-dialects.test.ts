import { tokenize } from "../parser/tokenize";
import { parse } from "../parser/parse";
import { emit } from "./index";

const SCHEMA = `erDiagram
CUSTOMER {
  int    id    [PK]
  string email [UK]
  string name
}
ORDER {
  int  id        [PK]
  date placed_at
}
CUSTOMER ||--o{ ORDER : "places"`;

describe("cross-dialect consistency", () => {

    it("all dialects produce one CREATE TABLE per entity, plus one ALTER TABLE", () => {
    const schema = parse(tokenize(SCHEMA));
    for (const dialect of ["oracle", "postgres", "mysql"] as const) {
      const sql = emit(schema, { dialect, naming: "snake_case" });
      const createCount = (sql.match(/CREATE TABLE/g) ?? []).length;
      const alterCount = (sql.match(/ALTER TABLE/g) ?? []).length;
      expect(createCount).toBe(2);
      expect(alterCount).toBe(1);
    }
  });

  it("join-table FKs reference the actual PK column name, not a hardcoded 'id'", () => {
    const schema = parse(tokenize(`erDiagram
POST {
  int post_pk [PK]
  string title
}
TAG {
  int tag_pk [PK]
  string name
}
POST }o--o{ TAG : "tagged with"`));
    for (const dialect of ["oracle", "postgres", "mysql"] as const) {
      const sql = emit(schema, { dialect, naming: "snake_case" });
      expect(sql).toContain("REFERENCES post (post_pk)");
      expect(sql).toContain("REFERENCES tag (tag_pk)");
      expect(sql).not.toContain("REFERENCES post (id)");
      expect(sql).not.toContain("REFERENCES tag (id)");
    }
  });

  it("all dialects produce different SQL for the same schema", () => {
    const schema = parse(tokenize(SCHEMA));
    const oracle = emit(schema, { dialect: "oracle", naming: "snake_case" });
    const postgres = emit(schema, { dialect: "postgres", naming: "snake_case" });
    const mysql = emit(schema, { dialect: "mysql", naming: "snake_case" });
    // Each pair differs
    expect(oracle).not.toBe(postgres);
    expect(postgres).not.toBe(mysql);
    expect(oracle).not.toBe(mysql);
    // Dialect-specific markers
    expect(oracle).toContain("VARCHAR2");
    expect(postgres).toContain("VARCHAR(255)");
    expect(mysql).toContain("ENGINE=InnoDB");
  });
});
