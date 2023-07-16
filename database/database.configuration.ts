import { ConfigService, registerAs } from '@nestjs/config';
import { config as dotenvConfig } from 'dotenv';
import { DataSource, DataSourceOptions } from 'typeorm';

const env = dotenvConfig({ path: `.env.${process.env.NODE_ENV}` });

const configService = new ConfigService({ load: [() => env] });

const IS_LOCAL = configService.get<string>('NODE_ENV') === 'local';

const IS_OFFLINE_OR_LOCAL = Boolean(configService.get<string>('IS_OFFLINE')) || IS_LOCAL;

const config: DataSourceOptions = {
  type: 'mariadb',
  host: configService.get<string>('DATABASE_HOST'),
  port: +configService.get<string>('DATABASE_PORT'),
  database: configService.get<string>('DATABASE_NAME'),
  username: configService.get<string>('DATABASE_USER'),
  password: configService.get<string>('DATABASE_PASSWORD'),
  entities: ['dist/**/*.entity.js'],
  migrations: [`dist/database/migrations/${configService.get<string>('NODE_ENV')}/*.js`],
  synchronize: IS_LOCAL, // never use TRUE in production!
  // migrationsRun: configService.get<string>('NODE_ENV') === 'dev',
  dropSchema: false,
  connectTimeout: 10000,
};

if (IS_OFFLINE_OR_LOCAL) {
  Object.assign(config, {
    logger: 'file',
    logging: true,
  });
}

export default registerAs('connection', () => config);
export const connectionSource = new DataSource(config as DataSourceOptions);
