import { TypeOrmModuleOptions } from '@nestjs/typeorm';
import * as config from 'config';

const dbConfig = config.get('db');
export const typeOrmConfig: TypeOrmModuleOptions = {
  type: 'postgres',
  host: 'localhost',
  port: dbConfig.port,
  username: 'postgres',
  password: 'postgres',
  database: dbConfig.name,
  entities: [__dirname + '/../**/*.entity.{js,ts}'],
  synchronize: true,
  dropSchema: dbConfig.drop,
  logging: true,
  keepConnectionAlive: true,
};
