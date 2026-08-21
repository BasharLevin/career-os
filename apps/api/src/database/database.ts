import { parseApiEnvironment } from '@career-os/config';
import { DataSource } from 'typeorm';
import { PhaseTwoSchema1724230800000 } from './migrations/1724230800000-phase-two-schema.js';

export const DATA_SOURCE = Symbol('DATA_SOURCE');

export function createDataSource(): DataSource {
  const env = parseApiEnvironment(process.env);
  return new DataSource({
    type: 'mssql',
    host: env.DATABASE_HOST,
    port: env.DATABASE_PORT,
    username: env.DATABASE_USER,
    password: env.DATABASE_PASSWORD,
    database: env.DATABASE_NAME,
    synchronize: false,
    migrationsRun: false,
    migrations: [PhaseTwoSchema1724230800000],
    options: {
      encrypt: env.DATABASE_ENCRYPT,
      trustServerCertificate: env.DATABASE_TRUST_SERVER_CERTIFICATE,
      useUTC: true,
      abortTransactionOnError: true,
    },
    pool: { max: 20, min: 1, idleTimeoutMillis: 30_000 },
  });
}
