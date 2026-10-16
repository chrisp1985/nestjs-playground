import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, OpenAPIObject, SwaggerModule } from '@nestjs/swagger';

export const SWAGGER_PATH = 'api';

export function buildSwaggerDocument(app: INestApplication): OpenAPIObject {
  const config = new DocumentBuilder()
    .setTitle('nestjs-playground')
    .setDescription('Status, health and World Cup player API')
    .setVersion('0.0.1')
    .build();
  return SwaggerModule.createDocument(app, config);
}

// Serves the UI at /api and the raw spec at /api-json.
export function setupSwagger(app: INestApplication): void {
  SwaggerModule.setup(SWAGGER_PATH, app, () => buildSwaggerDocument(app));
}
