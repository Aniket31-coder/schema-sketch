import { tokenize } from "./parser/tokenize";
import { parse } from "./parser/parse";
import { validate } from "./parser/validate";
import { EXAMPLES } from "./examples";
import { emit } from "./dialects";

describe("examples", () => {

  for (const ex of EXAMPLES) {
    it(`'${ex.name}' parses and validates without errors`, () => {
      const schema = parse(tokenize(ex.source));
      const errors = validate(schema);
      expect(errors).toEqual([]);
      expect(schema.entities.length).toBeGreaterThan(0);
    });
  }
});

describe("examples emit cleanly with options", () => {

  for (const ex of EXAMPLES) {
    it(`'${ex.name}' emits Oracle DDL with timestamps`, () => {
      const schema = parse(tokenize(ex.source));
      const sql = emit(schema, {
        dialect: "oracle",
        naming: "snake_case",
        addTimestamps: true,
      });
      expect(sql).toContain("CREATE TABLE");
      expect(sql).toContain("created_at");
    });
  }
});