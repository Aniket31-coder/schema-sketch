import type { Schema } from "./types";

export type ValidationError = {
  message: string;
  line: number;
};

export function validate(schema: Schema): ValidationError[] {
  const errors: ValidationError[] = [];
  const entityNames = new Set(schema.entities.map((e) => e.name));
  const seenEntities = new Set<string>();

  for (const e of schema.entities) {
    if (seenEntities.has(e.name)) errors.push({ message: `entity '${e.name}' is declared more than once`, line: e.line });
    seenEntities.add(e.name);
  }

  for (const r of schema.relationships) {
    if (!entityNames.has(r.from)) errors.push({ message: `relationship references unknown entity '${r.from}'`, line: r.line });
    if (!entityNames.has(r.to)) errors.push({ message: `relationship references unknown entity '${r.to}'`, line: r.line });
  }

  for (const r of schema.relationships) {
    for (const entityName of [r.from, r.to]) {
      const entity = schema.entities.find((e) => e.name === entityName);
      if (!entity) continue;
      const hasPK = entity.attributes.some((a) => a.constraints.includes("PK"));
      if (!hasPK) errors.push({ message: `entity '${entityName}' is referenced by a relationship but has no primary key`, line: r.line });
    }
  }

  for (const e of schema.entities) {
    const seenAttrs = new Set<string>();
    for (const a of e.attributes) {
      if (seenAttrs.has(a.name)) errors.push({ message: `entity '${e.name}' has duplicate attribute '${a.name}'`, line: e.line });
      seenAttrs.add(a.name);
    }
  }

  return errors;
}
