import { z } from 'zod';
import { optionalString, stringArray, idString, optionalNumber, optionalDate } from './common.js';

export const rawRangeSchema = z
  .object({
    start: optionalNumber(0),
    end: optionalNumber(0),
  })
  .optional()
  .nullable();

export const lineSchema = z.object({
  id: idString,
  speaker: optionalString(200),
  text: optionalString(4000),
  offset: optionalNumber(null),
});

export const sceneSchema = z.object({
  id: idString,
  sceneNumber: optionalNumber(0),
  title: optionalString(200),
  location: optionalString(200),
  characters: stringArray,
  presentCharacters: stringArray,
  props: stringArray,
  stageDirections: stringArray,
  lines: z.array(lineSchema).optional().nullable().transform((v) => (Array.isArray(v) ? v : [])),
  summary: optionalString(2000),
  estimatedMinutes: optionalNumber(0),
  rawRange: rawRangeSchema,
  actId: idString,
  structure: optionalString(100),
});

export const characterSchema = z.object({
  id: idString,
  name: optionalString(200),
  role: optionalString(50),
  description: optionalString(4000),
  aliases: stringArray,
});

export const evidenceSchema = z
  .object({
    sceneId: idString,
    quote: optionalString(2000),
  })
  .optional()
  .nullable();

export const relationshipSchema = z.object({
  id: idString,
  from: optionalString(200),
  to: optionalString(200),
  relation: optionalString(200),
  needsReview: z.boolean().optional().nullable().transform((v) => Boolean(v)),
  evidence: evidenceSchema,
});

export const actSchema = z.object({
  id: idString,
  actNumber: optionalNumber(0),
  title: optionalString(200),
  sceneIds: stringArray,
});

export const metaSchema = z.object({
  source: optionalString(100),
  importedAt: optionalDate,
  parser: optionalString(100),
});

export const scriptDataSchema = z.object({
  summary: optionalString(4000),
  scenes: z.array(sceneSchema).optional().nullable().transform((v) =>
    Array.isArray(v) ? v : []
  ),
  characters: z.array(characterSchema).optional().nullable().transform((v) =>
    Array.isArray(v) ? v : []
  ),
  relationships: z.array(relationshipSchema).optional().nullable().transform((v) =>
    Array.isArray(v) ? v : []
  ),
  acts: z.array(actSchema).optional().nullable().transform((v) =>
    Array.isArray(v) ? v : []
  ),
  meta: metaSchema.optional().nullable(),
});

/** 剧本版本记录：{ id, source, parser, text, data, createdAt } */
export const scriptVersionSchema = z.object({
  id: idString,
  source: optionalString(100),
  parser: optionalString(100),
  text: optionalString(200000),
  data: scriptDataSchema.optional().nullable(),
  createdAt: optionalDate,
});
