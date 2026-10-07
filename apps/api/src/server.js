import { config } from './config.js';
import { createApp } from './app.js';
import { demoData } from './demo.js';
import { MemoryRepository } from './repositories/memory.js';
import { createDatabase } from './database/connection.js';
import { SequelizeRepository } from './repositories/sequelize.js';

// Esta primeira versão é um caderno pessoal local; autenticação é uma etapa futura.
if (!['127.0.0.1', 'localhost', '::1'].includes(config.host)) throw new Error('A versão inicial deve ser executada apenas no loopback.');
if (process.env.NODE_ENV === 'production' && config.demo) throw new Error('O modo demonstrativo não pode ser usado em produção.');
const database = config.demo ? null : createDatabase(config);
const repository = config.demo ? new MemoryRepository(demoData()) : new SequelizeRepository(database);
await repository.ping();
const server = createApp({ repository, demo: config.demo, webOrigin: config.webOrigin }).listen(config.port, config.host, () => {
  console.log(`Escudo RPG API: http://${config.host}:${config.port} (${config.demo ? 'DEMO: alterações temporárias' : 'MySQL'})`);
});
for (const signal of ['SIGINT', 'SIGTERM']) process.on(signal, () => {
  server.close(async () => { if (database) await database.sequelize.close(); process.exit(0); });
});
