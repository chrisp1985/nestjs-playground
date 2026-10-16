import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module.js';
import { setupSwagger } from './swagger.js';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  // Close the HTTP server and DB pool cleanly on SIGTERM (e.g. Kubernetes pod shutdown).
  app.enableShutdownHooks();
  setupSwagger(app);
  const config = app.get(ConfigService);
  await app.listen(config.getOrThrow<number>('PORT'));
}
await bootstrap();
