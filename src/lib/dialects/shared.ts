import { Entity, Schema } from "../parser/types";
import type { NamingConvention } from "./types";

export function rename(input: string, convention: NamingConvention): string {
  const words = input
    .replace(/([a-z])([A-Z])/g, "$1_$2")
    .toLowerCase()
    .split("_")
    .filter(Boolean);

  if (convention === "snake_case") return words.join("_");
  return words.map((w) => w[0].toUpperCase() + w.slice(1)).join("");
}

export function indent(block: string, spaces = 2): string {
  const pad = " ".repeat(spaces);
  return block.split("\n").map((line) => (line.length === 0 ? line : pad + line)).join("\n");
}

export function padRight(s: string, width: number): string {
  if (s.length >= width) return s;
  return s + " ".repeat(width - s.length);
}

export function maxLen(strings: string[]): number {
  return strings.reduce((m, s) => Math.max(m, s.length), 0);
}

export function findPK(entity: Entity) {
  return entity.attributes.filter((a) => a.constraints.includes("PK"));
}

export function indexEntities(schema: Schema): Map<string, Entity> {
  return new Map(schema.entities.map((e) => [e.name, e]));
}

export function fkColumnName(entityName: string, naming: NamingConvention): string {
  if (naming === "snake_case") return rename(entityName, "snake_case") + "_id";
  return rename(entityName, "PascalCase") + "Id";
}
