export const ORACLE_RESERVED = new Set([
  "ORDER", "USER", "GROUP", "SELECT", "TABLE", "INDEX", "VIEW",
  "FROM", "WHERE", "JOIN", "UNION", "AS", "ASC", "DESC", "BY",
  "LEVEL", "ROWNUM", "NUMBER", "DATE", "TIMESTAMP", "VARCHAR2",
  "ROWID", "CONNECT", "START", "PRIOR", "ACCESS", "SESSION",
]);

export const POSTGRES_RESERVED = new Set([
  "ORDER", "USER", "GROUP", "SELECT", "TABLE", "INDEX", "VIEW",
  "FROM", "WHERE", "JOIN", "UNION", "AS", "ASC", "DESC", "BY",
  "SESSION", "AUTHORIZATION", "ANALYZE",
]);

export const MYSQL_RESERVED = new Set([
  "ORDER", "USER", "GROUP", "SELECT", "TABLE", "INDEX", "VIEW",
  "FROM", "WHERE", "JOIN", "UNION", "AS", "ASC", "DESC", "BY",
  "READ", "RANGE", "USAGE",
]);

export function quoteIfReserved(name: string, dialect: "oracle" | "postgres" | "mysql"): string {
  const upper = name.toUpperCase();
  const reserved = dialect === "oracle" ? ORACLE_RESERVED : dialect === "postgres" ? POSTGRES_RESERVED : MYSQL_RESERVED;
  if (!reserved.has(upper)) return name;
  const quote = dialect === "mysql" ? "`" : '"';
  return `${quote}${name}${quote}`;
}
