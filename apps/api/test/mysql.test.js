import { beforeAll, afterAll, describe, expect, it } from 'vitest';
import { randomUUID } from 'node:crypto';
import { config } from '../src/config.js';
import { createDatabase } from '../src/database/connection.js';
import { migrator } from '../src/database/migrate.js';
import { SequelizeRepository } from '../src/repositories/sequelize.js';
import { campaignSchema, characterSchema, entrySchema } from '../src/schemas.js';

describe.skipIf(process.env.TEST_MYSQL !== 'true')('integração com MySQL real', () => {
  let database, repository, campaign;
  beforeAll(async () => {
    if (!config.database.endsWith('_test')) throw new Error('TEST_MYSQL exige DB_NAME terminado em _test.');
    database = createDatabase(config); await migrator(database.sequelize).up();
    repository = new SequelizeRepository(database);
    campaign = await repository.createCampaign(campaignSchema.parse({ name: `Teste ${randomUUID()}` }));
  }, 30000);
  afterAll(async () => { if (campaign) await database.models.Campaign.destroy({ where: { id: campaign.id } }); if (database) await database.sequelize.close(); });
  it('persiste JSON após reconectar e rejeita perda de atualização no banco', async () => {
    const character = await repository.createCharacter(campaign.id, characterSchema.parse({ name: 'Personagem SQL' }));
    const item = await repository.createEntry(campaign.id, entrySchema.parse({ kind: 'item', title: 'Munição SQL', characterId: character.id, payload: { quantity: 10 } }));
    const results = await Promise.allSettled([repository.updateEntry(campaign.id, item.id, { payload: { quantity: 9 } }, 0), repository.updateEntry(campaign.id, item.id, { payload: { quantity: 8 } }, 0)]);
    expect(results.filter((r) => r.status === 'fulfilled')).toHaveLength(1);
    const another = createDatabase(config);
    try { expect((await new SequelizeRepository(another).getEntry(campaign.id, item.id)).revision).toBe(1); } finally { await another.sequelize.close(); }
    await repository.createLink(campaign.id, { sourceId: item.id, targetId: (await repository.createEntry(campaign.id, entrySchema.parse({ kind: 'location', title: 'Armazém' }))).id, relation: 'located-at' });
    await repository.deleteEntry(campaign.id, item.id, 1);
    expect((await repository.snapshot(campaign.id)).links).toHaveLength(0);
  });
  it('mantém importação idempotente em armazenamento persistente', async () => {
    const notes = [{ title: 'Original', body: 'Conteúdo integral', sourcePath: 'Notas/original.md', section: 'Notas', missingLinks: [] }];
    expect((await repository.importNotes(campaign.id, notes)).created).toBe(1);
    expect((await repository.importNotes(campaign.id, notes)).skipped).toBe(1);
    const entry = (await repository.snapshot(campaign.id)).entries.find((e) => e.title === 'Original');
    expect(entry.payload.originalBody).toBe('Conteúdo integral');
  });
});
