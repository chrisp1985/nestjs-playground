import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Player } from './player.entity.js';
import { PlayersController } from './players.controller.js';
import { PlayersService } from './players.service.js';
import { MetricsModule } from '../metrics/metrics.module.js';

@Module({
  imports: [TypeOrmModule.forFeature([Player]), MetricsModule],
  controllers: [PlayersController],
  providers: [PlayersService],
  exports: [PlayersService],
})
export class PlayersModule {}
