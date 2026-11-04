import { Controller, Get, Param, ParseIntPipe} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { ScoutingService } from './scouting.service.js';
import { Player } from '../players/player.entity.js';
import { ScoutingResponse } from './dto/scouting-response.dto.js';

@ApiTags('scouting')
@ApiBadRequestResponse({ description: 'Invalid parameters or body' })
@Controller('scouting')
export class ScoutingController {
  constructor(private readonly scoutingService: ScoutingService) {}

 @Get(':id')
  @ApiOperation({ summary: 'Get a scouted player' })
  @ApiParam({ name: 'id', description: 'Player number', example: 1 })
  @ApiOkResponse({ type: Player })
  @ApiNotFoundResponse({ description: 'No player with that number' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<ScoutingResponse> {
    return this.scoutingService.findOne(id);
  }
}