import { randomUUID } from 'node:crypto';

export class HttpError extends Error {
  constructor(status, message) { super(message); this.status = status; }
}
export const missing = () => new HttpError(404, 'Registro não encontrado nesta campanha.');
export const conflict = () => new HttpError(409, 'Este registro mudou em outra janela. Atualize antes de salvar.');

/** Implementação exclusivamente demonstrativa e para testes do contrato HTTP. */
export class MemoryRepository {
  constructor(data = { campaigns: [], characters: [], entries: [], links: [] }) { this.data = structuredClone(data); }
  async ping() { return true; }
  async listCampaigns() { return structuredClone(this.data.campaigns); }
  async createCampaign(values) { const c = { ...values, id: randomUUID() }; this.data.campaigns.push(c); return structuredClone(c); }
  async snapshot(campaignId) {
    const campaign = this.data.campaigns.find((c) => c.id === campaignId);
    if (!campaign) throw missing();
    return structuredClone({ campaign, characters: this.data.characters.filter((c) => c.campaignId === campaignId), entries: this.data.entries.filter((e) => e.campaignId === campaignId), links: this.data.links.filter((l) => l.campaignId === campaignId) });
  }
  async getCharacter(campaignId, id) { const c = this.data.characters.find((c) => c.id === id && c.campaignId === campaignId); if (!c) throw missing(); return structuredClone(c); }
  async createCharacter(campaignId, values) { const c = { ...values, campaignId, id: randomUUID(), revision: 0 }; this.data.characters.push(c); return structuredClone(c); }
  async updateCharacter(campaignId, id, values, expectedRevision) {
    const c = this.data.characters.find((c) => c.id === id && c.campaignId === campaignId);
    if (!c) throw missing(); if (c.revision !== expectedRevision) throw conflict();
    Object.assign(c, values, { revision: c.revision + 1 }); return structuredClone(c);
  }
  async getEntry(campaignId, id) { const e = this.data.entries.find((e) => e.id === id && e.campaignId === campaignId); if (!e) throw missing(); return structuredClone(e); }
  async createEntry(campaignId, values) { const e = { ...values, id: randomUUID(), campaignId, revision: 0 }; this.data.entries.push(e); return structuredClone(e); }
  async updateEntry(campaignId, id, values, expectedRevision) {
    const e = this.data.entries.find((e) => e.id === id && e.campaignId === campaignId);
    if (!e) throw missing(); if (e.revision !== expectedRevision) throw conflict();
    Object.assign(e, values, { revision: e.revision + 1 }); return structuredClone(e);
  }
  async deleteEntry(campaignId, id, expectedRevision) {
    const e = await this.getEntry(campaignId, id); if (e.revision !== expectedRevision) throw conflict();
    this.data.links = this.data.links.filter((l) => l.sourceId !== id && l.targetId !== id);
    this.data.entries = this.data.entries.filter((e) => e.id !== id);
  }
  async createLink(campaignId, values) {
    const existing = this.data.links.find((l) => l.campaignId === campaignId && l.sourceId === values.sourceId && l.targetId === values.targetId && l.relation === values.relation);
    if (existing) return structuredClone(existing);
    const link = { ...values, campaignId, id: randomUUID() }; this.data.links.push(link); return structuredClone(link);
  }
  async importNotes(campaignId, notes) {
    const result = { created: 0, skipped: 0, changed: 0, pending: 0 };
    for (const note of notes) {
      const existing = this.data.entries.find((e) => e.campaignId === campaignId && e.payload.sourcePath === note.sourcePath);
      if (existing) { result.skipped++; if (existing.body !== note.body) result.changed++; continue; }
      const pending = !note.body.trim() || note.missingLinks.length > 0;
      await this.createEntry(campaignId, { kind: 'note', characterId: null, title: note.title, body: note.body, knowledge: pending ? 'needs-review' : 'confirmed', source: note.sourcePath, payload: { sourcePath: note.sourcePath, originalBody: note.body, section: note.section, missingLinks: note.missingLinks } });
      result.created++; if (pending) result.pending++;
    }
    return result;
  }
}
