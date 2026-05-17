export type Dialect = "oracle" | "postgres" | "mysql";
export type NamingConvention = "snake_case" | "PascalCase";

export type EmitOptions = {
  dialect: Dialect;
  naming: NamingConvention;
  addTimestamps?: boolean;
  addAuditColumns?: boolean;
};

export type DialectSpec = {
  name: "oracle" | "postgres" | "mysql";
  typeMap: Record<string, string>;
  fallbackType: (mermaidType: string) => string;
  reserved: Set<string>;
  quote: '"' | '`';
  tableSuffix?: string;
};
