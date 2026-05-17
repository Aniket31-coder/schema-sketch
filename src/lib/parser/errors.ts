export class ParseError extends Error {
  line: number;
  column: number;

  constructor(message: string, line: number, column: number) {
    super(`line ${line}, column ${column}: ${message}`);
    this.name = "ParseError";
    this.line = line;
    this.column = column;
  }
}
