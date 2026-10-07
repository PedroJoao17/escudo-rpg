import dotenv from 'dotenv';
import { fileURLToPath } from 'node:url';

dotenv.config({ path: fileURLToPath(new URL('../../../.env', import.meta.url)), quiet: true });
export const config = {
  port: Number(process.env.PORT ?? 4000),
  host: process.env.HOST ?? '127.0.0.1',
  webOrigin: process.env.WEB_ORIGIN ?? 'http://localhost:3000',
  demo: process.env.DEMO_MODE === 'true',
  database: process.env.DB_NAME ?? 'escudo_rpg',
  user: process.env.DB_USER ?? 'escudo',
  password: process.env.DB_PASSWORD ?? 'escudo_local',
  dbHost: process.env.DB_HOST ?? '127.0.0.1',
  dbPort: Number(process.env.DB_PORT ?? 3307),
};
