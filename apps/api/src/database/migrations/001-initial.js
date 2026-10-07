export async function up({ context: { queryInterface: q, DataTypes: D } }) {
  const id = () => ({ type: D.UUID, primaryKey: true, allowNull: false });
  const times = () => ({ createdAt: { type: D.DATE, allowNull: false }, updatedAt: { type: D.DATE, allowNull: false } });
  const campaignId = () => ({ type: D.UUID, allowNull: false, references: { model: 'campaigns', key: 'id' }, onDelete: 'CASCADE' });
  await q.createTable('campaigns', { id: id(), name: { type: D.STRING(200), allowNull: false }, description: D.TEXT, rulesProfile: D.STRING(30), gameDay: D.INTEGER, ...times() });
  await q.createTable('characters', { id: id(), campaignId: campaignId(), name: D.STRING(200), className: D.STRING(200), species: D.STRING(200), background: D.STRING(200), level: D.INTEGER, hp: D.INTEGER, hpMax: D.INTEGER, tempHp: D.INTEGER, armorClass: D.INTEGER, speed: D.FLOAT, attributes: D.JSON, details: D.JSON, resources: D.JSON, revision: { type: D.INTEGER, allowNull: false, defaultValue: 0 }, ...times() });
  await q.createTable('entries', { id: id(), campaignId: campaignId(), characterId: { type: D.UUID, allowNull: true, references: { model: 'characters', key: 'id' }, onDelete: 'SET NULL' }, kind: D.STRING(30), title: D.STRING(200), body: D.TEXT('long'), knowledge: D.STRING(30), source: D.STRING(1000), sourceKey: { type: D.STRING(500), allowNull: true }, payload: D.JSON, revision: { type: D.INTEGER, allowNull: false, defaultValue: 0 }, ...times() });
  await q.addIndex('entries', ['campaignId', 'kind']);
  await q.addIndex('entries', ['campaignId', 'sourceKey'], { unique: true, name: 'entries_import_source_unique' });
  const reference = () => ({ type: D.UUID, allowNull: false, references: { model: 'entries', key: 'id' }, onDelete: 'CASCADE' });
  await q.createTable('entry_links', { id: id(), campaignId: campaignId(), sourceId: reference(), targetId: reference(), relation: D.STRING(30), ...times() });
  await q.addIndex('entry_links', ['campaignId', 'sourceId', 'targetId', 'relation'], { unique: true, name: 'entry_links_relation_unique' });
}
export async function down({ context: { queryInterface: q } }) {
  for (const table of ['entry_links', 'entries', 'characters', 'campaigns']) await q.dropTable(table);
}
