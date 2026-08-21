import { Global, Module } from '@nestjs/common';
import { DATA_SOURCE, createDataSource } from './database.js';

@Global()
@Module({
  providers: [
    {
      provide: DATA_SOURCE,
      useFactory: async () => createDataSource().initialize(),
    },
  ],
  exports: [DATA_SOURCE],
})
export class DatabaseModule {}
