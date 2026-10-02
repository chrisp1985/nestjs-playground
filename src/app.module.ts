import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { Player } from './players/player.entity.js';
import { PlayersModule } from './players/players.module.js';

@Module({
  imports: [
    TypeOrmModule.forRoot({
      type: 'postgres',
      host: process.env.DB_HOST ?? 'localhost',
      port: Number(process.env.DB_PORT ?? 5433),
      database: process.env.DB_NAME ?? 'players',
      username: process.env.DB_USER ?? 'appuser',
      password: process.env.DB_PASSWORD ?? 'mypassword',
      entities: [Player],
      // Schema is owned by db/init SQL scripts, not TypeORM.
      synchronize: false,
    }),
    PlayersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
