import type { Token, TokenType, Schema, Entity, Attribute, Constraint, CardinalitySide, Relationship } from "./types";
import { ParseError } from "./errors";

export function parse(tokens: Token[]): Schema {
  let pos = 0;

  const peek = (): Token => tokens[pos];
  const advance = (): Token => { const t = tokens[pos]; pos += 1; return t; };
  const atEnd = (): boolean => peek().type === "EOF";

  const expect = (type: TokenType, label: string): Token => {
    const t = peek();
    if (t.type !== type) {
      const useFallback = t.type === "NEWLINE" || t.type === "EOF";
      const prev = tokens[pos - 1];
      throw new ParseError(
        `expected ${label}, got ${describe(t)}`,
        useFallback && prev ? prev.line : t.line,
        useFallback && prev ? prev.column + prev.value.length : t.column
      );
    }
    return advance();
  };

  const describe = (t: Token): string => {
    if (t.type === "EOF") return "end of input";
    if (t.type === "NEWLINE") return "newline";
    return `'${t.value}' (${t.type})`;
  };

  const skipNewlines = (): void => { while (peek().type === "NEWLINE") advance(); };

  const interpretCardinality = (value: string, line: number, column: number): { fromSide: CardinalitySide; toSide: CardinalitySide } => {
    if (!value.includes("--")) throw new ParseError(`malformed cardinality '${value}'`, line, column);
    const leftSymbol = value.slice(0, 2);
    const rightSymbol = value.slice(-2);
    return { fromSide: sideFromSymbol(leftSymbol, "left", line, column), toSide: sideFromSymbol(rightSymbol, "right", line, column) };
  };

  const sideFromSymbol = (symbol: string, which: "left" | "right", line: number, column: number): CardinalitySide => {
    const outer = which === "left" ? symbol[0] : symbol[1];
    const inner = which === "left" ? symbol[1] : symbol[0];
    const many = outer === "}" || outer === "{" || outer === "o";
    const mandatory = inner === "|";
    return { many, mandatory };
  };

  const parseSchema = (): Schema => {
    skipNewlines();
    expect("ER_DIAGRAM", "'erDiagram' keyword at top of file");
    const entities: Entity[] = [];
    const relationships: Relationship[] = [];

    while (!atEnd()) {
      skipNewlines();
      if (atEnd()) break;
      if (peek().type !== "IDENT") {
        const t = peek();
        throw new ParseError(`expected entity or relationship, got ${describe(t)}`, t.line, t.column);
      }
      const next = tokens[pos + 1];
      if (next?.type === "CARDINALITY") relationships.push(parseRelationship());
      else entities.push(parseEntity());
    }

    return { entities, relationships };
  };

  const parseEntity = (): Entity => {
    const nameToken = expect("IDENT", "entity name");
    expect("LBRACE", "'{' to open entity body");
    const attributes: Attribute[] = [];

    while (peek().type !== "RBRACE") {
      if (atEnd()) throw new ParseError(`unterminated entity body for '${nameToken.value}'`, nameToken.line, nameToken.column);
      if (peek().type === "NEWLINE") { advance(); continue; }
      attributes.push(parseAttribute());
    }

    expect("RBRACE", "'}' to close entity body");
    return { name: nameToken.value, attributes, line: nameToken.line };
  };

  const parseAttribute = (): Attribute => {
    const typeToken = expect("IDENT", "attribute type");
    const nameToken = expect("IDENT", "attribute name");
    const constraints: Constraint[] = [];

    while (peek().type === "LBRACKET") {
      advance();
      const constraintToken = expect("IDENT", "constraint name (PK, FK, or UK)");
      const c = constraintToken.value.toUpperCase();
      if (c !== "PK" && c !== "FK" && c !== "UK") throw new ParseError(`unknown constraint '${constraintToken.value}' (expected PK, FK, or UK)`, constraintToken.line, constraintToken.column);
      constraints.push(c as Constraint);
      expect("RBRACKET", "']' to close constraint");
    }

    let comment: string | undefined;
    if (peek().type === "STRING") comment = advance().value;

    return { name: nameToken.value, type: typeToken.value, constraints, nullable: true, comment };
  };

  const parseRelationship = (): Relationship => {
    const fromToken = expect("IDENT", "entity name on left side of relationship");
    const cardToken = expect("CARDINALITY", "cardinality marker (e.g. ||--o{)");
    const toToken = expect("IDENT", "entity name on right side of relationship");
    const { fromSide, toSide } = interpretCardinality(cardToken.value, cardToken.line, cardToken.column);

    let label: string | undefined;
    if (peek().type === "COLON") {
      advance();
      const labelToken = expect("STRING", "quoted relationship label after ':'");
      label = labelToken.value;
    }

    return { from: fromToken.value, to: toToken.value, fromSide, toSide, label, line: fromToken.line };
  };

  return parseSchema();
}
