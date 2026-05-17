import type { Schema } from "../parser/types";
import type { EmitOptions, DialectSpec } from "./types";
import { emitWithSpec } from "./emit-core";
import { POSTGRES_RESERVED } from "./reserved";

const POSTGRES_SPEC: DialectSpec = {
  name: "postgres",
  typeMap: { string: "VARCHAR(255)", text: "TEXT", int: "INTEGER", bigint: "BIGINT", decimal: "NUMERIC(19,4)", bool: "BOOLEAN", date: "DATE", timestamp: "TIMESTAMP", uuid: "UUID" },
  fallbackType: (t) => t.toUpperCase(),
  reserved: POSTGRES_RESERVED,
  quote: '"',
};

export function emitPostgres(schema: Schema, options: EmitOptions): string {
  return emitWithSpec(schema, POSTGRES_SPEC, options.naming);
}
