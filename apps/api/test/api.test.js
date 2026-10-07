import request from 'supertest';
import { beforeEach, describe, expect, it } from 'vitest';
import { createApp } from '../src/app.js';
import { MemoryRepository } from '../src/repositories/memory.js';
import { demoData, demoIds } from '../src/demo.js';

let api;
const base = `/api/v1/campaigns/${demoIds.campaign}`;
beforeEach(() => { api = request(createApp({ repository: new MemoryRepository(demoData()), demo: true })); });
describe('contrato da API', () => {
  it('retorna ficha, cartões e relações reais e identifica modo demo', async () => {
    expect((await api.get('/api/v1/campaigns')).body.mode).toBe('demo');
    const response = await api.get(`${base}/screen`);
    expect(response.status).toBe(200); expect(response.body.entries).toHaveLength(14); expect(response.body.links).toHaveLength(6);
  });
  it('persiste uma edição e impede a segunda edição baseada em uma revisão antiga', async () => {
    const url = `${base}/characters/${demoIds.character}`;
    expect((await api.patch(url).send({ name: 'Ari atualizado', expectedRevision: 0 })).status).toBe(200);
    expect((await api.patch(url).send({ name: 'Edição antiga', expectedRevision: 0 })).status).toBe(409);
    expect((await api.get(`${base}/screen`)).body.characters[0].name).toBe('Ari atualizado');
  });
  it('mantém PV consistentes em duas solicitações concorrentes', async () => {
    const url = `${base}/characters/${demoIds.character}/hp`;
    const results = await Promise.all([api.post(url).send({ delta: -3, expectedRevision: 0 }), api.post(url).send({ delta: -4, expectedRevision: 0 })]);
    expect(results.map((r) => r.status).sort()).toEqual([200, 409]);
  });
  it('não permite consumir um item abaixo de zero', async () => {
    const item = (await api.get(`${base}/screen`)).body.entries.find((e) => e.title === 'Flechas');
    expect((await api.post(`${base}/entries/${item.id}/quantity`).send({ delta: -13, expectedRevision: 0 })).status).toBe(422);
    expect((await api.post(`${base}/entries/${item.id}/quantity`).send({ delta: -1, expectedRevision: 0 })).body.payload.quantity).toBe(11);
  });
  it('valida payload tipado mesmo em edição parcial', async () => {
    expect((await api.post(`${base}/entries`).send({ kind: 'item', title: 'Teste', payload: { quantity: -1 } })).status).toBe(422);
    expect((await api.patch(`${base}/characters/${demoIds.character}`).send({ hp: 999, expectedRevision: 0 })).status).toBe(422);
  });
  it('impede relações e vínculos de personagem entre campanhas', async () => {
    const other = (await api.post('/api/v1/campaigns').send({ name: 'Outra campanha' })).body;
    const foreign = (await api.post(`/api/v1/campaigns/${other.id}/entries`).send({ kind: 'npc', title: 'Outro NPC' })).body;
    const local = (await api.get(`${base}/screen`)).body.entries[0];
    expect((await api.post(`${base}/links`).send({ sourceId: local.id, targetId: foreign.id, relation: 'mentions' })).status).toBe(404);
    expect((await api.post(`/api/v1/campaigns/${other.id}/entries`).send({ kind: 'item', title: 'Outra espada', characterId: demoIds.character })).status).toBe(404);
  });
  it('preserva a nota integral, aponta vazios e não sobrescreve uma importação repetida', async () => {
    const notes = [{ title: 'Nota vazia', body: '', sourcePath: 'NPCs/Nota.md', missingLinks: ['Ausente'] }];
    expect((await api.post(`${base}/import-notes`).send({ notes })).body).toMatchObject({ created: 1, pending: 1 });
    notes[0].body = 'Nova versão';
    expect((await api.post(`${base}/import-notes`).send({ notes })).body).toMatchObject({ skipped: 1, changed: 1 });
  });
  it('calcula dado físico com decomposição e recusa código como fórmula', async () => {
    const response = await api.post('/api/v1/calculations/check').send({ score: 17, level: 2, proficiency: 'proficient', rolls: [12] });
    expect(response.body.total).toBe(17);
    expect((await api.post('/api/v1/calculations/dice').send({ expression: 'process.exit()' })).status).toBe(422);
  });
  it('exclui vínculos ao remover o registro e exige revisão', async () => {
    const snapshot = (await api.get(`${base}/screen`)).body;
    const entry = snapshot.entries.find((e) => e.title === 'Oficina');
    expect((await api.delete(`${base}/entries/${entry.id}?revision=5`)).status).toBe(409);
    expect((await api.delete(`${base}/entries/${entry.id}?revision=0`)).status).toBe(204);
    expect((await api.get(`${base}/screen`)).body.links.some((l) => l.targetId === entry.id || l.sourceId === entry.id)).toBe(false);
  });
});
