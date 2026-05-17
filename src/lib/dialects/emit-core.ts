import type { Schema, Entity, Attribute } from "../parser/types";
import type { DialectSpec, NamingConvention } from "./types";
import { rename, indent, padRight, maxLen, findPK, indexEntities, fkColumnName } from "./shared";

function mapType(spec: DialectSpec, mermaidType: string): string {
  return spec.typeMap[mermaidType.toLowerCase()] ?? spec.fallbackType(mermaidType);
}

function quoteIfReserved(spec: DialectSpec, name: string): string {
  if (!spec.reserved.has(name.toUpperCase())) return name;
  return `${spec.quote}${name}${spec.quote}`;
}

function renameAndQuote(spec: DialectSpec, name: string, naming: NamingConvention): string {
  return quoteIfReserved(spec, rename(name, naming));
}

function stripQuotes(s: string): string {
  return s.replace(/^["`]|["`]$/g, "");
}

type FkColumn = { name: string; type: string; notNull: boolean };
type FkConstraint = { childTable: string; parentTable: string; childColumn: string; parentColumn: string };
type JoinTable = {
  name: string;
  left: { table: string; column: string; type: string; pkColumn: string };
  right: { table: string; column: string; type: string; pkColumn: string };
};
type FkPlan = { extraColumns: Map<string, FkColumn[]>; fkConstraints: FkConstraint[]; joinTables: JoinTable[] };

function planFKs(schema: Schema, spec: DialectSpec, naming: NamingConvention): FkPlan {
  const extraColumns = new Map<string, FkColumn[]>();
  const fkConstraints: FkConstraint[] = [];
  const joinTables: JoinTable[] = [];
  const entities = indexEntities(schema);

  for (const rel of schema.relationships) {
    const fromEntity = entities.get(rel.from);
    const toEntity = entities.get(rel.to);
    if (!fromEntity || !toEntity) continue;

    const fromPK = findPK(fromEntity);
    const toPK = findPK(toEntity);
    if (fromPK.length === 0 || toPK.length === 0) continue;

    const fromMany = rel.fromSide.many;
    const toMany = rel.toSide.many;

    if (fromMany && toMany) {
      const [a, b] = rel.from.toLowerCase() < rel.to.toLowerCase() ? [rel.from, rel.to] : [rel.to, rel.from];
      const joinName = `${rename(a, naming)}_${rename(b, naming)}`;
      joinTables.push({
        name: joinName,
        left: { table: renameAndQuote(spec, a, naming), column: fkColumnName(a, naming), type: mapType(spec, findPK(entities.get(a)!)[0].type), pkColumn: rename(findPK(entities.get(a)!)[0].name, naming) },
        right: { table: renameAndQuote(spec, b, naming), column: fkColumnName(b, naming), type: mapType(spec, findPK(entities.get(b)!)[0].type), pkColumn: rename(findPK(entities.get(b)!)[0].name, naming) },
      });
      continue;
    }

    let parentEntity: Entity, childEntity: Entity, childNotNull: boolean;
    if (fromMany && !toMany) { parentEntity = toEntity; childEntity = fromEntity; childNotNull = rel.toSide.mandatory; }
    else if (!fromMany && toMany) { parentEntity = fromEntity; childEntity = toEntity; childNotNull = rel.fromSide.mandatory; }
    else { parentEntity = fromEntity; childEntity = toEntity; childNotNull = rel.fromSide.mandatory; }

    const parentPK = findPK(parentEntity)[0];
    const childColumn = fkColumnName(parentEntity.name, naming);
    const existing = extraColumns.get(childEntity.name) ?? [];
    existing.push({ name: childColumn, type: mapType(spec, parentPK.type), notNull: childNotNull });
    extraColumns.set(childEntity.name, existing);

    fkConstraints.push({
      childTable: renameAndQuote(spec, childEntity.name, naming),
      parentTable: renameAndQuote(spec, parentEntity.name, naming),
      childColumn: rename(childColumn, naming),
      parentColumn: rename(parentPK.name, naming),
    });
  }

  return { extraColumns, fkConstraints, joinTables };
}

function emitEntity(spec: DialectSpec, entity: Entity, extras: FkColumn[], naming: NamingConvention): string {
  const tableName = renameAndQuote(spec, entity.name, naming);
  const renderedColumns = [
    ...entity.attributes.map((a) => ({ name: rename(a.name, naming), type: mapType(spec, a.type), notNull: true, attribute: a as Attribute | null })),
    ...extras.map((fk) => ({ name: fk.name, type: fk.type, notNull: fk.notNull, attribute: null as Attribute | null })),
  ];

  const nameWidth = maxLen(renderedColumns.map((c) => c.name));
  const typeWidth = maxLen(renderedColumns.map((c) => c.type));
  const columnLines = renderedColumns.map((c) => `${padRight(c.name, nameWidth)} ${padRight(c.type, typeWidth)} ${c.notNull ? "NOT NULL" : "NULL"}`);

  const pkColumns = renderedColumns.filter((c) => c.attribute?.constraints.includes("PK")).map((c) => c.name);
  const constraintLines: string[] = [];
  if (pkColumns.length > 0) constraintLines.push(`CONSTRAINT pk_${rename(entity.name, naming)} PRIMARY KEY (${pkColumns.join(", ")})`);
  for (const c of renderedColumns) {
    if (c.attribute?.constraints.includes("UK")) constraintLines.push(`CONSTRAINT uk_${rename(entity.name, naming)}_${c.name} UNIQUE (${c.name})`);
  }

  const allLines = [...columnLines, ...constraintLines];
  const body = allLines.map((line, i) => (i === allLines.length - 1 ? line : `${line},`)).join("\n");
  const suffix = spec.tableSuffix ?? "";
  return `CREATE TABLE ${tableName} (\n${indent(body)}\n)${suffix};`;
}

function emitJoinTable(spec: DialectSpec, jt: JoinTable, naming: NamingConvention): string {
  const leftCol = rename(jt.left.column, naming);
  const rightCol = rename(jt.right.column, naming);
  const nameWidth = Math.max(leftCol.length, rightCol.length);
  const typeWidth = Math.max(jt.left.type.length, jt.right.type.length);
  const columnLines = [`${padRight(leftCol, nameWidth)} ${padRight(jt.left.type, typeWidth)} NOT NULL`, `${padRight(rightCol, nameWidth)} ${padRight(jt.right.type, typeWidth)} NOT NULL`];
  const pk = `CONSTRAINT pk_${jt.name} PRIMARY KEY (${leftCol}, ${rightCol})`;
  const allLines = [...columnLines, pk];
  const body = allLines.map((line, i) => (i === allLines.length - 1 ? line : `${line},`)).join("\n");
  const suffix = spec.tableSuffix ?? "";
  return `CREATE TABLE ${jt.name} (\n${indent(body)}\n)${suffix};`;
}

function emitFkConstraint(fk: FkConstraint, naming: NamingConvention): string {
  const constraintName = `fk_${rename(stripQuotes(fk.childTable), naming)}_${rename(stripQuotes(fk.parentTable), naming)}`;
  return [`ALTER TABLE ${fk.childTable}`, `  ADD CONSTRAINT ${constraintName}`, `  FOREIGN KEY (${fk.childColumn}) REFERENCES ${fk.parentTable} (${fk.parentColumn});`].join("\n");
}

export function emitWithSpec(schema: Schema, spec: DialectSpec, naming: NamingConvention): string {
  const plan = planFKs(schema, spec, naming);
  const tableStatements = schema.entities.map((e) => emitEntity(spec, e, plan.extraColumns.get(e.name) ?? [], naming));
  const joinStatements = plan.joinTables.map((jt) => emitJoinTable(spec, jt, naming));
  const fkStatements = plan.fkConstraints.map((fk) => emitFkConstraint(fk, naming));
  const joinFkStatements = plan.joinTables.flatMap((jt) => [
    emitFkConstraint({ childTable: jt.name, parentTable: jt.left.table, childColumn: rename(jt.left.column, naming), parentColumn: jt.left.pkColumn }, naming),
    emitFkConstraint({ childTable: jt.name, parentTable: jt.right.table, childColumn: rename(jt.right.column, naming), parentColumn: jt.right.pkColumn }, naming),
  ]);
  return [...tableStatements, ...joinStatements, ...fkStatements, ...joinFkStatements].join("\n\n") + "\n";
}
