import type { Schema } from "../parser/types";
import type { EmitOptions, DialectSpec } from "./types";
import { emitWithSpec } from "./emit-core";
import { MYSQL_RESERVED } from "./reserved";

const MYSQL_SPEC: DialectSpec = {
  name: "mysql",
  typeMap: { string: "VARCHAR(255)", text: "TEXT", int: "INT", bigint: "BIGINT", decimal: "DECIMAL(19,4)", bool: "TINYINT(1)", date: "DATE", timestamp: "TIMESTAMP", uuid: "CHAR(36)" },
  fallbackType: (t) => t.toUpperCase(),
  reserved: MYSQL_RESERVED,
  quote: '`',
  tableSuffix: " ENGINE=InnoDB",
};

export function emitMySQL(schema: Schema, options: EmitOptions): string {
  return emitWithSpec(schema, MYSQL_SPEC, options.naming);
}
