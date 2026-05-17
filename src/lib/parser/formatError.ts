import { ParseError } from "./errors";

export function formatError(
  error: ParseError,
  source: string,
  options: { pointerLength?: number } = {}
): string {
  const { pointerLength = 1 } = options;
  const lines = source.split("\n");
  const offendingLine = lines[error.line - 1] ?? "";

  const indent = " ".repeat(error.column - 1);
  const pointer = "^".repeat(Math.max(1, pointerLength));

  return [
    error.message,
    "",
    `    ${offendingLine}`,
    `    ${indent}${pointer}`,
  ].join("\n");
}
