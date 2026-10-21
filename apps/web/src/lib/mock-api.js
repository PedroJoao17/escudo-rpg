import { createMockData } from './mock-data';

const STORAGE_KEY = 'escudo-rpg:mock-store:v3';
const clone = (value) => typeof structuredClone === 'function' ? structuredClone(value) : JSON.parse(JSON.stringify(value));
const makeId = () => globalThis.crypto?.randomUUID?.() ?? `mock-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

function loadStore() {
  if (typeof window === 'undefined') return createMockData();
  try {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    if (saved) return JSON.parse(saved);
  } catch { /* localStorage indisponível: usa o mock inicial em memória */ }
  const initial = createMockData();
  saveStore(initial);
  return initial;
}

function saveStore(store) {
  if (typeof window === 'undefined') return;
  try { window.localStorage.setItem(STORAGE_KEY, JSON.stringify(store)); } catch { /* sem persistência local */ }
}

function fail(message) {
  throw new Error(message);
}

function findCampaign(store, campaignId) {
  const campaign = store.campaigns.find((item) => item.id === campaignId);
  if (!campaign) fail('Campanha mock não encontrada.');
  return campaign;
}

function findCharacter(store, campaignId, characterId) {
  const character = store.characters.find((item) => item.campaignId === campaignId && item.id === characterId);
  if (!character) fail('Personagem mock não encontrado.');
  return character;
}

function findEntry(store, campaignId, entryId) {
  const entry = store.entries.find((item) => item.campaignId === campaignId && item.id === entryId);
  if (!entry) fail('Registro mock não encontrado.');
  return entry;
}

function screen(store, campaignId) {
  const campaign = findCampaign(store, campaignId);
  return clone({
    campaign,
    characters: store.characters.filter((item) => item.campaignId === campaignId),
    entries: store.entries.filter((item) => item.campaignId === campaignId),
    links: store.links.filter((item) => item.campaignId === campaignId),
  });
}

export async function mockRequest(path, options = {}) {
  const method = (options.method ?? 'GET').toUpperCase();
  const cleanPath = path.split('?')[0];
  const segments = cleanPath.split('/').filter(Boolean);
  const body = options.body ? JSON.parse(options.body) : undefined;
  const store = loadStore();

  if (segments.length === 1 && segments[0] === 'campaigns') {
    if (method === 'GET') return clone({ campaigns: store.campaigns, mode: 'mock' });
    if (method === 'POST') {
      const campaign = { id: makeId(), name: body.name, description: body.description ?? '', rulesProfile: body.rulesProfile ?? 'homebrew', gameDay: body.gameDay ?? 1 };
      store.campaigns.push(campaign);
      saveStore(store);
      return clone(campaign);
    }
  }

  if (segments[0] !== 'campaigns' || !segments[1]) fail(`Rota mock não suportada: ${method} ${path}`);
  const campaignId = segments[1];
  findCampaign(store, campaignId);

  if (segments[2] === 'screen' && method === 'GET') return screen(store, campaignId);
  if (segments[2] === 'export' && method === 'GET') return screen(store, campaignId);

  if (segments[2] === 'characters') {
    if (segments.length === 3 && method === 'POST') {
      const character = { ...body, id: makeId(), campaignId, revision: 0 };
      store.characters.push(character);
      saveStore(store);
      return clone(character);
    }
    const character = findCharacter(store, campaignId, segments[3]);
    if (segments.length === 4 && method === 'PATCH') {
      Object.assign(character, body, { revision: (character.revision ?? 0) + 1 });
      delete character.expectedRevision;
      saveStore(store);
      return clone(character);
    }
    if (segments[4] === 'hp' && method === 'POST') {
      const delta = Number(body.delta ?? 0);
      character.hp = Math.max(0, Math.min(character.hpMax, Number(character.hp ?? 0) + delta));
      character.revision = (character.revision ?? 0) + 1;
      saveStore(store);
      return clone(character);
    }
  }

  if (segments[2] === 'entries') {
    if (segments.length === 3 && method === 'POST') {
      const entry = { ...body, id: makeId(), campaignId, revision: 0, payload: body.payload ?? {}, source: body.source ?? 'Anotação do jogador', knowledge: body.knowledge ?? 'confirmed' };
      store.entries.push(entry);
      saveStore(store);
      return clone(entry);
    }

    const entry = findEntry(store, campaignId, segments[3]);
    if (segments.length === 4 && method === 'PATCH') {
      Object.assign(entry, body, { revision: (entry.revision ?? 0) + 1 });
      delete entry.expectedRevision;
      saveStore(store);
      return clone(entry);
    }
    if (segments.length === 4 && method === 'DELETE') {
      store.entries = store.entries.filter((item) => item.id !== entry.id);
      store.links = store.links.filter((link) => link.sourceId !== entry.id && link.targetId !== entry.id);
      saveStore(store);
      return null;
    }
    if (segments[4] === 'quantity' && method === 'POST') {
      const quantity = Math.max(0, Number(entry.payload?.quantity ?? 0) + Number(body.delta ?? 0));
      entry.payload = { ...(entry.payload ?? {}), quantity };
      entry.revision = (entry.revision ?? 0) + 1;
      saveStore(store);
      return clone(entry);
    }
  }

  if (segments[2] === 'links' && method === 'POST') {
    const link = { id: makeId(), campaignId, sourceId: body.sourceId, targetId: body.targetId, relation: body.relation };
    store.links.push(link);
    saveStore(store);
    return clone(link);
  }

  fail(`Rota mock não suportada: ${method} ${path}`);
}
