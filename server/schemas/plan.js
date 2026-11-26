import { z } from 'zod';
import {
  BRIEF_STATUS_VALUES,
  CUE_STATUS_VALUES,
  IMPACT_STATUS_VALUES,
  ASSET_STATUS_VALUES,
  DISCUSSION_STATUS_VALUES,
} from '@director/shared/constants/status.js';
import { optionalString, stringArray, idString, optionalNumber, optionalDate, looseObject } from './common.js';

const itemOrObject = z.union([z.string().trim(), looseObject]);
const itemArray = z.array(itemOrObject).optional().nullable().transform((v) => (Array.isArray(v) ? v : []));

// ---------- 段落 segment ----------
export const segmentSchema = z.object({
  id: idString,
  title: optionalString(200),
  sceneIds: stringArray,
  rawRange: z
    .object({ start: optionalNumber(0), end: optionalNumber(0) })
    .optional()
    .nullable(),
  castIds: stringArray,
  goals: stringArray,
});

// ---------- 提示 cue ----------
const cueAnchor = z
  .object({
    kind: optionalString(50),
    sceneId: idString,
    quote: optionalString(2000),
  })
  .optional()
  .nullable();

const cueTrigger = z
  .object({
    type: optionalString(50),
    quote: optionalString(2000),
    offset: optionalNumber(null),
  })
  .optional()
  .nullable();

export const cueSchema = z.object({
  id: idString,
  department: optionalString(50),
  sceneId: idString,
  sceneNumber: optionalNumber(null),
  anchor: cueAnchor,
  trigger: cueTrigger,
  content: optionalString(4000),
  status: z.enum(CUE_STATUS_VALUES).optional().nullable(),
  note: optionalString(2000),
});

// ---------- 需求 brief ----------
export const briefSchema = z.object({
  id: idString,
  department: optionalString(50),
  sceneId: idString,
  sceneNumber: optionalNumber(null),
  cueId: idString,
  original: optionalString(4000),
  items: stringArray,
  uncertain: stringArray,
  priority: optionalString(20),
  dueDate: optionalDate,
  status: z.enum(BRIEF_STATUS_VALUES).optional().nullable(),
  owner: optionalString(100),
  note: optionalString(2000),
});

// ---------- 舞台 staging ----------
export const placementSchema = z.object({
  sceneNumber: optionalNumber(null),
  characterId: idString,
  x: optionalNumber(0),
  y: optionalNumber(0),
});

export const stageObjectSchema = z.object({
  id: idString,
  kind: optionalString(50),
  label: optionalString(200),
  sceneNumber: optionalNumber(null),
  x: optionalNumber(400),
  y: optionalNumber(260),
  rotation: optionalNumber(0),
  scale: optionalNumber(1),
});

const pointSchema = z.object({ x: optionalNumber(0), y: optionalNumber(0) });

export const pathSchema = z.object({
  id: idString,
  sceneNumber: optionalNumber(null),
  characterId: idString,
  points: z.array(pointSchema).optional().nullable().transform((v) => (Array.isArray(v) ? v : [])),
  triggerQuote: optionalString(2000),
});

export const stagingSchema = z
  .object({
    stage: looseObject,
    placements: z.array(placementSchema).optional().nullable().transform((v) => (Array.isArray(v) ? v : [])),
    objects: z.array(stageObjectSchema).optional().nullable().transform((v) => (Array.isArray(v) ? v : [])),
    paths: z.array(pathSchema).optional().nullable().transform((v) => (Array.isArray(v) ? v : [])),
    notes: itemArray,
  })
  .optional()
  .nullable();

// ---------- 排练 rehearsal ----------
export const rehearsalSchema = z.object({
  id: idString,
  segmentId: idString,
  date: optionalString(50),
  location: optionalString(200),
  castIds: stringArray,
  notes: z.union([z.string(), itemArray]).optional().nullable(),
  decisions: itemArray,
  openQuestions: itemArray,
  todos: itemArray,
});

// ---------- 影响项 impact ----------
const impactTarget = z
  .object({ kind: optionalString(50), refId: idString })
  .optional()
  .nullable();

export const impactSchema = z.object({
  id: idString,
  change: looseObject,
  target: impactTarget,
  reason: optionalString(2000),
  suggestion: optionalString(2000),
  status: z.enum(IMPACT_STATUS_VALUES).optional().nullable(),
});

// ---------- 讨论 discussion ----------
export const discussionSchema = z.object({
  id: idString,
  title: optionalString(200),
  kind: optionalString(20),
  createdAt: optionalDate,
  durationSec: optionalNumber(0),
  audioUrl: optionalString(2000),
  transcript: optionalString(200000),
  status: z.enum(DISCUSSION_STATUS_VALUES).optional().nullable(),
  summary: looseObject,
});

// ---------- 资产 asset ----------
export const assetSchema = z.object({
  id: idString,
  type: optionalString(50),
  taskId: optionalString(200),
  title: optionalString(200),
  status: z.enum(ASSET_STATUS_VALUES).optional().nullable(),
  url: optionalString(2000),
  updatedAt: optionalDate,
  staleReason: optionalString(2000),
  characterName: optionalString(200),
  styleProfile: looseObject,
});

// ---------- 复盘 review / 收藏 collection ----------
export const reviewSchema = z.object({
  goal: optionalString(2000),
  wentWell: optionalString(2000),
  improve: optionalString(2000),
  nextActions: optionalString(2000),
  conclusion: optionalString(2000),
  updatedAt: optionalDate,
});

export const collectionSchema = z.object({
  id: idString,
  text: optionalString(2000),
  createdAt: optionalDate,
});

const aiConsentSchema = z
  .object({
    text: z.boolean().optional().nullable().transform((v) => Boolean(v)),
    authorizedAt: optionalDate,
    mediaConfirmRequired: z.boolean().optional().nullable().transform((v) => Boolean(v)),
  })
  .optional()
  .nullable();

// ---------- plan 顶层 ----------
export const planSchema = z.object({
  id: idString,
  type: optionalString(50),
  name: optionalString(200),
  sourceVersion: idString,
  segments: z.array(segmentSchema).optional().nullable().transform((v) => (Array.isArray(v) ? v : [])),
  cues: z.array(cueSchema).optional().nullable().transform((v) => (Array.isArray(v) ? v : [])),
  briefs: z.array(briefSchema).optional().nullable().transform((v) => (Array.isArray(v) ? v : [])),
  staging: stagingSchema,
  rehearsals: z.array(rehearsalSchema).optional().nullable().transform((v) => (Array.isArray(v) ? v : [])),
  impacts: z.array(impactSchema).optional().nullable().transform((v) => (Array.isArray(v) ? v : [])),
  aiConsent: aiConsentSchema,
  style: looseObject,
  assets: z.array(assetSchema).optional().nullable().transform((v) => (Array.isArray(v) ? v : [])),
  discussions: z.array(discussionSchema).optional().nullable().transform((v) =>
    Array.isArray(v) ? v : []
  ),
  review: reviewSchema.optional().nullable(),
  collections: z.array(collectionSchema).optional().nullable().transform((v) =>
    Array.isArray(v) ? v : []
  ),
});
