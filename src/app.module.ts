import { Module, ValidationPipe, MiddlewareConsumer, NestModule, } from '@nestjs/common';
import { ConfigModule, ConfigType } from '@nestjs/config';
import { APP_FILTER, APP_PIPE } from '@nestjs/core';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { databaseConfig } from './config/database.config.js';
import { envValidationSchema } from './config/env.validation.js';
import { HealthModule } from './health/health.module.js';
import { Player } from './players/player.entity.js';
import { PlayersModule } from './players/players.module.js';
import { HttpExceptionFilter } from './common/filters/http-exception.filter.js';
import { RequestIdMiddleware } from './common/middleware/request-id.middleware.js';
import { APP_INTERCEPTOR } from '@nestjs/core';
import { LoggingInterceptor } from './common/interceptors/logging.interceptor.js';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      cache: true,
      load: [databaseConfig],
      validationSchema: envValidationSchema,
    }),
    TypeOrmModule.forRootAsync({
      inject: [databaseConfig.KEY],
      useFactory: (db: ConfigType<typeof databaseConfig>) => ({
        type: 'postgres',
        host: db.host,
        port: db.port,
        database: db.name,
        username: db.user,
        password: db.password,
        entities: [Player],
        // pg returns BIGINT as a string by default; ids fit safely in a JS number.
        parseInt8: true,
        synchronize: false,
      }),
    }),
    HealthModule,
    PlayersModule,
  ],
  controllers: [AppController],
  providers: [
    AppService,
    // Registered here rather than in main.ts so e2e tests get the same validation.
    {
      provide: APP_PIPE,
      useValue: new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    },
    {
      provide: APP_FILTER,
      useClass: HttpExceptionFilter,
    }
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer): void {
    consumer.apply(RequestIdMiddleware).forRoutes('*');
  }
}
