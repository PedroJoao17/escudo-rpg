import { missing, conflict } from './memory.js';

const plain = (model) => model.get({ plain: true });
export class SequelizeRepository {
  constructor({ sequelize, models }) { this.sequelize = sequelize; this.models = models; }
  async ping() { await this.sequelize.authenticate(); }
  async listCampaigns() { return (await this.models.Campaign.findAll({ order: [['createdAt', 'ASC']] })).map(plain); }
  async createCampaign(values) { return plain(await this.models.Campaign.create(values)); }
  async snapshot(campaignId) {
    const campaign = await this.models.Campaign.findByPk(campaignId); if (!campaign) throw missing();
    const [characters, entries, links] = await Promise.all(['Character', 'Entry', 'Link'].map((m) => this.models[m].findAll({ where: { campaignId }, order: [['createdAt', 'ASC']] })));
    return { campaign: plain(campaign), characters: characters.map(plain), entries: entries.map(plain), links: links.map(plain) };
  }
  async getCharacter(campaignId, id) { return this.get('Character', campaignId, id); }
  async getEntry(campaignId, id) { return this.get('Entry', campaignId, id); }
  async get(model, campaignId, id) { const value = await this.models[model].findOne({ where: { id, campaignId } }); if (!value) throw missing(); return plain(value); }
  async createCharacter(campaignId, values) { return plain(await this.models.Character.create({ ...values, campaignId })); }
  async createEntry(campaignId, values) { return plain(await this.models.Entry.create({ ...values, campaignId })); }
  async update(model, campaignId, id, values, expectedRevision) {
    const [count] = await this.models[model].update({ ...values, revision: expectedRevision + 1 }, { where: { id, campaignId, revision: expectedRevision } });
    if (!count) { await this.get(model, campaignId, id); throw conflict(); }
    return this.get(model, campaignId, id);
  }
  async updateCharacter(campaignId, id, values, expectedRevision) { return this.update('Character', campaignId, id, values, expectedRevision); }
  async updateEntry(campaignId, id, values, expectedRevision) { return this.update('Entry', campaignId, id, values, expectedRevision); }
  async deleteEntry(campaignId, id, revision) {
    const count = await this.models.Entry.destroy({ where: { id, campaignId, revision } });
    if (!count) { await this.getEntry(campaignId, id); throw conflict(); }
  }
  async createLink(campaignId, values) {
    const [link] = await this.models.Link.findOrCreate({ where: { campaignId, ...values } }); return plain(link);
  }
  async importNotes(campaignId, notes) {
    return this.sequelize.transaction(async (transaction) => {
      const result = { created: 0, skipped: 0, changed: 0, pending: 0 };
      for (const note of notes) {
        const pending = !note.body.trim() || note.missingLinks.length > 0;
        const [entry, created] = await this.models.Entry.findOrCreate({ where: { campaignId, sourceKey: note.sourcePath }, defaults: { kind: 'note', characterId: null, title: note.title, body: note.body, knowledge: pending ? 'needs-review' : 'confirmed', source: note.sourcePath, payload: { sourcePath: note.sourcePath, originalBody: note.body, section: note.section, missingLinks: note.missingLinks } }, transaction });
        if (created) { result.created++; if (pending) result.pending++; }
        else { result.skipped++; if (entry.body !== note.body) result.changed++; }
      }
      return result;
    });
  }
}
