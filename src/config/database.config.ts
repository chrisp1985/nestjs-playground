import { registerAs } from '@nestjs/config';

// Values are validated by envValidationSchema before this factory runs.
export const databaseConfig = registerAs('database', () => ({
  host: process.env.DB_HOST!,
  port: Number(process.env.DB_PORT),
  name: process.env.DB_NAME!,
  user: process.env.DB_USER!,
  password: process.env.DB_PASSWORD!,
}));
