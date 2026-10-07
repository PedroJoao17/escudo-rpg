import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import { randomInt } from 'node:crypto';
import { z } from 'zod';
import { calculateCheck, rollCheck, rollExpression, adjustHitPoints } from '@escudo/rules';
import { campaignSchema, characterSchema, entrySchema, idSchema, revisionSchema, checkSchema, hpSchema, quantitySchema, linkSchema, importSchema } from './schemas.js';
import { HttpError } from './repositories/memory.js';

export function createApp({ repository, demo = false, webOrigin = 'http://localhost:3000' }) {
  const app = express();
  app.disable('x-powered-by');
  app.use(helmet(), cors({ origin: webOrigin }), express.json({ limit: '1mb' }));
  app.get('/health', (_req, res) => res.json({ status: 'ok', mode: demo ? 'demo' : 'mysql' }));
  app.get('/ready', async (_req, res) => { await repository.ping(); res.json({ status: 'ok' }); });
  const router = express.Router();
  app.use('/api/v1', router);
  router.get('/campaigns', async (_req, res) => res.json({ campaigns: await repository.listCampaigns(), mode: demo ? 'demo' : 'mysql' }));
  router.post('/campaigns', async (req, res) => res.status(201).json(await repository.createCampaign(campaignSchema.parse(req.body))));
  router.param('campaignId', async (req, _res, next, campaignId) => { idSchema.parse(campaignId); await repository.snapshot(campaignId); next(); });
  router.get('/campaigns/:campaignId/screen', async (req, res) => res.json(await repository.snapshot(req.params.campaignId)));
  router.get('/campaigns/:campaignId/export', async (req, res) => res.json({ schemaVersion: 1, exportedAt: new Date().toISOString(), ...await repository.snapshot(req.params.campaignId) }));
  router.post('/campaigns/:campaignId/characters', async (req, res) => res.status(201).json(await repository.createCharacter(req.params.campaignId, characterSchema.parse(req.body))));
  router.patch('/campaigns/:campaignId/characters/:id', async (req, res) => {
    idSchema.parse(req.params.id);
    const { expectedRevision, ...patch } = z.object({ expectedRevision: revisionSchema }).passthrough().parse(req.body);
    const current = await repository.getCharacter(req.params.campaignId, req.params.id);
    const editable = Object.fromEntries(Object.entries(current).filter(([key]) => !['id', 'campaignId', 'revision', 'createdAt', 'updatedAt'].includes(key)));
    const values = characterSchema.parse({ ...editable, ...patch });
    res.json(await repository.updateCharacter(req.params.campaignId, req.params.id, values, expectedRevision));
  });
  router.post('/campaigns/:campaignId/characters/:id/hp', async (req, res) => {
    idSchema.parse(req.params.id); const { delta, expectedRevision } = hpSchema.parse(req.body);
    const current = await repository.getCharacter(req.params.campaignId, req.params.id);
    res.json(await repository.updateCharacter(req.params.campaignId, req.params.id, adjustHitPoints(current, delta), expectedRevision));
  });
  router.post('/campaigns/:campaignId/entries', async (req, res) => {
    const values = entrySchema.parse(req.body);
    if (values.characterId) await repository.getCharacter(req.params.campaignId, values.characterId);
    res.status(201).json(await repository.createEntry(req.params.campaignId, values));
  });
  router.patch('/campaigns/:campaignId/entries/:id', async (req, res) => {
    idSchema.parse(req.params.id);
    const { expectedRevision, ...patch } = z.object({ expectedRevision: revisionSchema }).passthrough().parse(req.body);
    const current = await repository.getEntry(req.params.campaignId, req.params.id);
    const editable = Object.fromEntries(Object.entries(current).filter(([key]) => !['id', 'campaignId', 'revision', 'createdAt', 'updatedAt', 'sourceKey'].includes(key)));
    const values = entrySchema.parse({ ...editable, ...patch });
    if (values.characterId) await repository.getCharacter(req.params.campaignId, values.characterId);
    res.json(await repository.updateEntry(req.params.campaignId, req.params.id, values, expectedRevision));
  });
  router.post('/campaigns/:campaignId/entries/:id/quantity', async (req, res) => {
    idSchema.parse(req.params.id); const { delta, expectedRevision } = quantitySchema.parse(req.body);
    const current = await repository.getEntry(req.params.campaignId, req.params.id);
    if (current.kind !== 'item') throw new HttpError(400, 'Somente itens possuem quantidade.');
    const quantity = (current.payload.quantity ?? 1) + delta;
    if (quantity < 0 || quantity > 1000000) throw new HttpError(422, 'Quantidade deve estar entre zero e um milhão.');
    res.json(await repository.updateEntry(req.params.campaignId, req.params.id, { payload: { ...current.payload, quantity } }, expectedRevision));
  });
  router.delete('/campaigns/:campaignId/entries/:id', async (req, res) => {
    idSchema.parse(req.params.id); const expectedRevision = z.coerce.number().int().min(0).parse(req.query.revision);
    await repository.deleteEntry(req.params.campaignId, req.params.id, expectedRevision); res.status(204).end();
  });
  router.post('/campaigns/:campaignId/links', async (req, res) => {
    const values = linkSchema.parse(req.body);
    if (values.sourceId === values.targetId) throw new HttpError(422, 'Selecione dois registros diferentes.');
    await repository.getEntry(req.params.campaignId, values.sourceId);
    await repository.getEntry(req.params.campaignId, values.targetId);
    res.status(201).json(await repository.createLink(req.params.campaignId, values));
  });
  router.post('/campaigns/:campaignId/import-notes', async (req, res) => res.status(201).json(await repository.importNotes(req.params.campaignId, importSchema.parse(req.body).notes)));
  router.post('/calculations/check', (req, res) => {
    const input = checkSchema.parse(req.body);
    // Dados físicos já informados não são repetidos silenciosamente pela opção Sortudo.
    res.json(input.rolls ? calculateCheck(input) : rollCheck(input, (sides) => randomInt(1, sides + 1)));
  });
  router.post('/calculations/dice', (req, res) => {
    const input = z.object({ expression: z.string().min(1).max(100), critical: z.boolean().default(false) }).strict().parse(req.body);
    res.json(rollExpression(input.expression, (sides) => randomInt(1, sides + 1), { critical: input.critical }));
  });
  app.use((_req, res) => res.status(404).json({ error: 'Rota não encontrada.' }));
  app.use((error, _req, res, _next) => {
    if (error instanceof z.ZodError) return res.status(422).json({ error: 'Verifique os dados informados.', details: error.issues.map((i) => ({ field: i.path.join('.'), message: i.message })) });
    if (error.type === 'entity.too.large') return res.status(413).json({ error: 'O envio excede 1 MB. Divida a importação.' });
    if (error instanceof SyntaxError && error.status === 400) return res.status(400).json({ error: 'JSON inválido.' });
    if (error instanceof HttpError) return res.status(error.status).json({ error: error.message });
    if (error.name?.includes('Sequelize')) { console.error('Falha no banco:', error.name); return res.status(503).json({ error: 'Não foi possível acessar o banco. Tente novamente.' }); }
    // Erros de entrada do motor de dados são públicos; erros desconhecidos não expõem stack.
    if (error.message?.match(/d20|expressão|dados|crítico|Proficiência|Modificador|Tipo de teste|CD|origem|Use /i)) return res.status(422).json({ error: error.message });
    console.error(error); res.status(500).json({ error: 'Não foi possível concluir a operação.' });
  });
  return app;
}
