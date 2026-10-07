import { pathToFileURL } from 'node:url';
import { config } from '../config.js';
import { createDatabase } from './connection.js';
import { demoData } from '../demo.js';

export async function seed(database) {
  const { models, sequelize } = database;
  const data = demoData();
  await sequelize.transaction(async (transaction) => {
    for (const [key, values] of [['Campaign', data.campaigns], ['Character', data.characters], ['Entry', data.entries], ['Link', data.links]]) {
      for (const value of values) await models[key].findOrCreate({ where: { id: value.id }, defaults: value, transaction });
    }
  });
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const database = createDatabase(config);
  try { await seed(database); console.log('Exemplos fictícios criados; registros existentes preservados.'); } finally { await database.sequelize.close(); }
}
