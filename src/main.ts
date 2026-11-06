import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupSwagger } from './swagger.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  const config = app.get(ConfigService);

  app.enableCors({
    origin: config.getOrThrow<string>('CORS_ORIGIN'),
    methods: ['GET', 'DELETE'],
  });

  app.enableShutdownHooks();
  setupSwagger(app);
  await app.listen(
    config.getOrThrow<number>('PORT'),
    '0.0.0.0',
  );
}
await bootstrap();
