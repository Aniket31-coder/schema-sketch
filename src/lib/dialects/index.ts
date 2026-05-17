import type { Schema } from "../parser/types";
import type { EmitOptions } from "./types";
import { emitOracle } from "./oracle";
import { emitPostgres } from "./postgres";
import { emitMySQL } from "./mysql";
import { applyOptions } from "./applyoptions";

export function emit(schema: Schema, options: EmitOptions): string {
  const transformed = applyOptions(schema, options);
  switch (options.dialect) {
    case "oracle": return emitOracle(transformed, options);
    case "postgres": return emitPostgres(transformed, options);
    case "mysql": return emitMySQL(transformed, options);
    default: {
      const _exhaustive: never = options.dialect;
      throw new Error(`unknown dialect: ${_exhaustive}`);
    }
  }
}

export type { Dialect, NamingConvention, EmitOptions, DialectSpec } from "./types";
