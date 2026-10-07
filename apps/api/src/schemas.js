import { z } from 'zod';

const text = (max = 200) => z.string().trim().min(1).max(max);
const longText = z.string().max(100000);
export const idSchema = z.uuid();
export const revisionSchema = z.number().int().min(0);
export const kinds = ['ability', 'item', 'npc', 'location', 'mechanic', 'note', 'companion'];
export const campaignSchema = z.object({
  name: text(),
  description: z.string().max(10000).default(''),
  rulesProfile: z.enum(['dnd5e-2014', 'dnd5e-2024', 'homebrew']).default('homebrew'),
  gameDay: z.number().int().min(0).max(100000).default(1),
}).strict();
export const characterSchema = z.object({
  name: text(),
  className: z.string().max(200).default(''),
  species: z.string().max(200).default(''),
  background: z.string().max(200).default(''),
  level: z.number().int().min(1).max(20).default(1),
  hp: z.number().int().min(0).max(10000).default(10),
  hpMax: z.number().int().min(1).max(10000).default(10),
  tempHp: z.number().int().min(0).max(10000).default(0),
  armorClass: z.number().int().min(0).max(100).default(10),
  speed: z.number().min(0).max(1000).default(9),
  attributes: z.object(Object.fromEntries(['str', 'dex', 'con', 'int', 'wis', 'cha'].map((key) => [key, z.number().int().min(1).max(30).default(10)]))).strict().default({ str: 10, dex: 10, con: 10, int: 10, wis: 10, cha: 10 }),
  details: z.record(z.string().max(100), longText).default({}),
  resources: z.array(z.object({ name: text(100), current: z.number().int().min(0), max: z.number().int().min(0), reset: z.enum(['manual', 'short-rest', 'long-rest', 'dawn']).default('manual') }).strict().refine((r) => r.current <= r.max, 'Recurso atual excede o máximo.')).max(100).default([]),
}).strict().refine((c) => c.hp <= c.hpMax, 'PV atual excede o máximo.');
export const entrySchema = z.object({
  kind: z.enum(kinds),
  characterId: idSchema.nullable().default(null),
  title: text(),
  body: longText.default(''),
  knowledge: z.enum(['confirmed', 'rumor', 'needs-review']).default('confirmed'),
  source: z.string().max(1000).default('Anotação do jogador'),
  payload: z.record(z.string().max(100), z.json()).default({}),
}).strict().superRefine((e, ctx) => {
  const check = (schema) => { const result = schema.safeParse(e.payload); if (!result.success) result.error.issues.forEach((i) => ctx.addIssue({ code: 'custom', path: ['payload', ...i.path], message: i.message })); };
  if (e.kind === 'item') check(z.object({ quantity: z.number().int().min(0).max(1000000).optional(), weight: z.number().min(0).max(100000).optional(), equipped: z.boolean().optional(), reusable: z.boolean().optional() }).passthrough());
  if (e.kind === 'ability') check(z.object({ requiredLevel: z.number().int().min(1).max(20).optional(), learned: z.boolean().optional(), category: z.string().max(100).optional(), activation: z.string().max(100).optional(), cost: z.string().max(200).optional() }).passthrough());
  if (e.kind === 'location') check(z.object({ x: z.number().min(0).max(100).optional(), y: z.number().min(0).max(100).optional() }).passthrough());
  if (e.kind === 'note') check(z.object({ gameDay: z.number().int().min(0).optional(), sessionDate: z.iso.date().optional(), section: z.string().max(200).optional() }).passthrough());
});
export const checkSchema = z.object({
  score: z.number().int().min(1).max(30), level: z.number().int().min(1).max(20),
  proficiency: z.enum(['none', 'proficient', 'expertise']).default('none'),
  bonuses: z.array(z.object({ label: text(100), value: z.number().int().min(-100).max(100) }).strict()).max(20).default([]),
  rolls: z.array(z.number().int().min(1).max(20)).max(2).optional(),
  advantage: z.boolean().default(false), disadvantage: z.boolean().default(false),
  rerollOnes: z.boolean().default(false),
  difficulty: z.number().int().min(1).max(100).optional(),
  kind: z.enum(['check', 'save', 'attack']).default('check'),
}).strict();
export const quantitySchema = z.object({ delta: z.number().int().min(-1000000).max(1000000), expectedRevision: revisionSchema }).strict();
export const hpSchema = z.object({ delta: z.number().int().min(-10000).max(10000), expectedRevision: revisionSchema }).strict();
export const linkSchema = z.object({ sourceId: idSchema, targetId: idSchema, relation: z.enum(['located-at', 'responsible-for', 'uses', 'mentions']) }).strict();
export const importSchema = z.object({ notes: z.array(z.object({ title: text(), body: longText, sourcePath: text(500), section: z.string().max(200).default('Importação'), missingLinks: z.array(z.string().max(1000)).max(200).default([]) }).strict()).min(1).max(300) }).strict();
