import type { Schema } from "../parser/types";
import type { EmitOptions, DialectSpec } from "./types";
import { emitWithSpec } from "./emit-core";
import { ORACLE_RESERVED } from "./reserved";

const ORACLE_SPEC: DialectSpec = {
  name: "oracle",
  typeMap: { string: "VARCHAR2(255)", text: "CLOB", int: "NUMBER(10)", bigint: "NUMBER(19)", decimal: "NUMBER(19,4)", bool: "NUMBER(1)", date: "DATE", timestamp: "TIMESTAMP", uuid: "VARCHAR2(36)" },
  fallbackType: (t) => t.toUpperCase(),
  reserved: ORACLE_RESERVED,
  quote: '"',
};

export function emitOracle(schema: Schema, options: EmitOptions): string {
  return emitWithSpec(schema, ORACLE_SPEC, options.naming);
}
