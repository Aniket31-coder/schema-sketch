export type TokenType =
  | "ER_DIAGRAM"
  | "IDENT"
  | "STRING"
  | "LBRACE"
  | "RBRACE"
  | "LBRACKET"
  | "RBRACKET"
  | "COLON"
  | "CARDINALITY"
  | "NEWLINE"
  | "EOF";

export type Token = {
  type: TokenType;
  value: string;
  line: number;
  column: number;
};

export type Schema = {
  entities: Entity[];
  relationships: Relationship[];
};

export type Entity = {
  name: string;
  attributes: Attribute[];
  line: number;
};

export type Attribute = {
  name: string;
  type: string;
  constraints: Constraint[];
  nullable: boolean;
  comment?: string;
};

export type Constraint = "PK" | "FK" | "UK";

export type CardinalitySide = {
  many: boolean;
  mandatory: boolean;
};

export type Relationship = {
  from: string;
  to: string;
  fromSide: CardinalitySide;
  toSide: CardinalitySide;
  label?: string;
  line: number;
};
