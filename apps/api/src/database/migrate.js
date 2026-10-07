import { Umzug, SequelizeStorage } from 'umzug';
import { DataTypes } from 'sequelize';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { config } from '../config.js';
import { createDatabase } from './connection.js';

export function migrator(sequelize) {
  return new Umzug({
    migrations: {
      glob: fileURLToPath(new URL('./migrations/*.js', import.meta.url)),
      resolve: ({ name, path, context }) => ({ name, up: async () => (await import(pathToFileURL(path).href)).up({ context }), down: async () => (await import(pathToFileURL(path).href)).down({ context }) }),
    },
    context: { queryInterface: sequelize.getQueryInterface(), DataTypes },
    storage: new SequelizeStorage({ sequelize }),
    logger: console,
  });
}
if (process.argv[1] && pathToFileURL(process.argv[1]).href === import.meta.url) {
  const { sequelize } = createDatabase(config);
  try { await migrator(sequelize).up(); } finally { await sequelize.close(); }
}
