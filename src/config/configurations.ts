import { registerAs } from '@nestjs/config';

export default registerAs('app', () => ({
  environment: process.env.NODE_ENV ?? 'development',
  port: Number(process.env.PORT ?? 3000),

  database: {
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT ?? 5432),
    username: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    dialect: 'postgres' as const,
    logging: process.env.DB_LOGGING === 'true',
  },
  admin: {
    userId: process.env.ADMIN_USER_ID,
    userSecret: process.env.ADMIN_USER_SECRET,
  },
}));
