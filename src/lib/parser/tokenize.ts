import type { Token } from "./types";
import { ParseError } from "./errors";

export function tokenize(source: string): Token[] {
  const tokens: Token[] = [];
  let pos = 0;
  let line = 1;
  let column = 1;

  const peek = (offset = 0): string => source[pos + offset] ?? "";
  const advance = (): string => {
    const ch = source[pos];
    pos += 1;
    column += 1;
    return ch;
  };
  const atEnd = (): boolean => pos >= source.length;

  while (!atEnd()) {
    const startLine = line;
    const startColumn = column;
    const ch = peek();

    if (ch === " " || ch === "\t" || ch === "\r") { advance(); continue; }
    if (ch === "\n") {
      tokens.push({ type: "NEWLINE", value: "\n", line, column });
      advance(); line += 1; column = 1; continue;
    }
    if (ch === "%" && peek(1) === "%") {
      while (!atEnd() && peek() !== "\n") advance();
      continue;
    }
    if (ch === "{") { tokens.push({ type: "LBRACE", value: "{", line: startLine, column: startColumn }); advance(); continue; }
    if (ch === "}") {
      const next = peek(1);
      if (next === "o" || next === "|") { /* fall through */ }
      else { tokens.push({ type: "RBRACE", value: "}", line: startLine, column: startColumn }); advance(); continue; }
    }
    if (ch === "[") { tokens.push({ type: "LBRACKET", value: "[", line: startLine, column: startColumn }); advance(); continue; }
    if (ch === "]") { tokens.push({ type: "RBRACKET", value: "]", line: startLine, column: startColumn }); advance(); continue; }
    if (ch === ":") { tokens.push({ type: "COLON", value: ":", line: startLine, column: startColumn }); advance(); continue; }
    if (ch === '"') {
      advance();
      let value = "";
      while (!atEnd() && peek() !== '"') {
        if (peek() === "\n") throw new ParseError("unterminated string", startLine, startColumn);
        value += advance();
      }
      if (atEnd()) throw new ParseError("unterminated string", startLine, startColumn);
      advance();
      tokens.push({ type: "STRING", value, line: startLine, column: startColumn });
      continue;
    }
    if (ch === "|" || ch === "o" || ch === "}") {
      const ahead = source.slice(pos, pos + 6);
      if (/--/.test(ahead)) {
        let value = "";
        while (!atEnd() && /[|o{}\-]/.test(peek())) value += advance();
        tokens.push({ type: "CARDINALITY", value, line: startLine, column: startColumn });
        continue;
      }
    }
    if (/[A-Za-z_]/.test(ch)) {
      let value = "";
      while (!atEnd() && /[A-Za-z0-9_]/.test(peek())) value += advance();
      if (value === "erDiagram") tokens.push({ type: "ER_DIAGRAM", value, line: startLine, column: startColumn });
      else tokens.push({ type: "IDENT", value, line: startLine, column: startColumn });
      continue;
    }
    throw new ParseError(`unexpected character '${ch}'`, startLine, startColumn);
  }

  tokens.push({ type: "EOF", value: "", line, column });
  return tokens;
}
