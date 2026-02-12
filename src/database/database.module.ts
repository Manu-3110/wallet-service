import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { DatabaseConfig } from './database.config';

@Module({
  imports: [
    SequelizeModule.forRootAsync({
      useClass: DatabaseConfig,
    }),
  ],
  providers: [DatabaseConfig],
})
export class DatabaseModule {}
