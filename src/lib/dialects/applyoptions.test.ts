import { tokenize } from "../parser/tokenize";
import { parse } from "../parser/parse";
import { emit } from "./index";

const SCHEMA = `erDiagram
CUSTOMER {
  int    id   [PK]
  string name
}`;

describe("emit options", () => {

  it("addTimestamps appends created_at and updated_at", () => {
    const schema = parse(tokenize(SCHEMA));
    const sql = emit(schema, {
      dialect: "oracle",
      naming: "snake_case",
      addTimestamps: true,
    });
    expect(sql).toContain("created_at");
    expect(sql).toContain("updated_at");
    expect(sql).toContain("TIMESTAMP");
  });

  it("addAuditColumns appends created_by and updated_by", () => {
    const schema = parse(tokenize(SCHEMA));
    const sql = emit(schema, {
      dialect: "oracle",
      naming: "snake_case",
      addAuditColumns: true,
    });
    expect(sql).toContain("created_by");
    expect(sql).toContain("updated_by");
  });

  it("does not duplicate columns the user already declared", () => {
    // User declared created_at manually
    const source = `erDiagram
LOG {
  int       id [PK]
  string    message
  timestamp created_at
}`;
    const schema = parse(tokenize(source));
    const sql = emit(schema, {
      dialect: "oracle",
      naming: "snake_case",
      addTimestamps: true,
    });
    // created_at should appear once, not twice
    const matches = sql.match(/created_at/g) ?? [];
    expect(matches.length).toBe(1);
  });

  it("options stack — both timestamps and audit columns", () => {
    const schema = parse(tokenize(SCHEMA));
    const sql = emit(schema, {
      dialect: "oracle",
      naming: "snake_case",
      addTimestamps: true,
      addAuditColumns: true,
    });
    expect(sql).toContain("created_at");
    expect(sql).toContain("updated_at");
    expect(sql).toContain("created_by");
    expect(sql).toContain("updated_by");
  });

  it("default options produce no extra columns", () => {
    const schema = parse(tokenize(SCHEMA));
    const sql = emit(schema, { dialect: "oracle", naming: "snake_case" });
    expect(sql).not.toContain("created_at");
    expect(sql).not.toContain("created_by");
  });

  it("addTimestamps works across all dialects", () => {
    const schema = parse(tokenize(SCHEMA));
    const oracle = emit(schema, {
      dialect: "oracle",
      naming: "snake_case",
      addTimestamps: true,
    });
    const postgres = emit(schema, {
      dialect: "postgres",
      naming: "snake_case",
      addTimestamps: true,
    });
    const mysql = emit(schema, {
      dialect: "mysql",
      naming: "snake_case",
      addTimestamps: true,
    });
    expect(oracle).toContain("TIMESTAMP");
    expect(postgres).toContain("TIMESTAMP");
    expect(mysql).toContain("TIMESTAMP");
  });
});
