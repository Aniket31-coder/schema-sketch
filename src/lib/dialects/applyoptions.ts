import type { Schema, Attribute } from "../parser/types";
import type { EmitOptions } from "./types";

export function applyOptions(schema: Schema, options: EmitOptions): Schema {
  let modified = schema;
  if (options.addTimestamps) {
    modified = addColumnsToAllEntities(modified, [
      { name: "created_at", type: "timestamp", constraints: [], nullable: false },
      { name: "updated_at", type: "timestamp", constraints: [], nullable: false },
    ]);
  }
  if (options.addAuditColumns) {
    modified = addColumnsToAllEntities(modified, [
      { name: "created_by", type: "string", constraints: [], nullable: false },
      { name: "updated_by", type: "string", constraints: [], nullable: false },
    ]);
  }
  return modified;
}

function addColumnsToAllEntities(schema: Schema, newAttrs: Attribute[]): Schema {
  return {
    ...schema,
    entities: schema.entities.map((entity) => {
      const existingNames = new Set(entity.attributes.map((a) => a.name));
      const additions = newAttrs.filter((a) => !existingNames.has(a.name));
      return { ...entity, attributes: [...entity.attributes, ...additions] };
    }),
  };
}
