import { HttpModule } from "@nestjs/axios";
import { Module } from '@nestjs/common';
import { ScoutingController } from "./scouting.controller.js";
import { ScoutingService } from "./scouting.service.js";

@Module({
  imports: [HttpModule],
  controllers: [ScoutingController],
  providers: [ScoutingService],
})
export class ScoutingModule {}