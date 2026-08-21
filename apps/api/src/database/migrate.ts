import 'reflect-metadata';
import { createDataSource } from './database.js';

const source = createDataSource();
try {
  await source.initialize();
  await source.runMigrations({ transaction: 'all' });
} finally {
  if (source.isInitialized) await source.destroy();
}
