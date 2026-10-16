import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  ParseIntPipe,
  Patch,
  Post,
  Query,
} from '@nestjs/common';
import {
  ApiBadRequestResponse,
  ApiCreatedResponse,
  ApiNoContentResponse,
  ApiNotFoundResponse,
  ApiOkResponse,
  ApiOperation,
  ApiParam,
  ApiTags,
} from '@nestjs/swagger';
import { CreatePlayerDto } from './dto/create-player.dto.js';
import { PaginatedPlayersDto } from './dto/paginated.dto.js';
import { PlayerQueryDto } from './dto/player-query.dto.js';
import { UpdatePlayerDto } from './dto/update-player.dto.js';
import { Player } from './player.entity.js';
import { PlayersService } from './players.service.js';

@ApiTags('players')
@ApiBadRequestResponse({ description: 'Invalid parameters or body' })
@Controller('players')
export class PlayersController {
  constructor(private readonly playersService: PlayersService) {}

  @Get()
  @ApiOperation({ summary: 'List players, filtered, sorted and paginated' })
  @ApiOkResponse({ type: PaginatedPlayersDto })
  findAll(@Query() query: PlayerQueryDto): Promise<PaginatedPlayersDto> {
    return this.playersService.findAll(query);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get one player' })
  @ApiParam({ name: 'id', description: 'Player number', example: 1 })
  @ApiOkResponse({ type: Player })
  @ApiNotFoundResponse({ description: 'No player with that number' })
  findOne(@Param('id', ParseIntPipe) id: number): Promise<Player> {
    return this.playersService.findOne(id);
  }

  @Post()
  @ApiOperation({ summary: 'Create a player' })
  @ApiCreatedResponse({ type: Player })
  create(@Body() dto: CreatePlayerDto): Promise<Player> {
    return this.playersService.create(dto);
  }

  @Patch(':id')
  @ApiOperation({ summary: "Update some of a player's fields" })
  @ApiParam({ name: 'id', description: 'Player number', example: 1 })
  @ApiOkResponse({ type: Player })
  @ApiNotFoundResponse({ description: 'No player with that number' })
  update(
    @Param('id', ParseIntPipe) id: number,
    @Body() dto: UpdatePlayerDto,
  ): Promise<Player> {
    return this.playersService.update(id, dto);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({ summary: 'Delete a player' })
  @ApiParam({ name: 'id', description: 'Player number', example: 1 })
  @ApiNoContentResponse({ description: 'Deleted' })
  @ApiNotFoundResponse({ description: 'No player with that number' })
  remove(@Param('id', ParseIntPipe) id: number): Promise<void> {
    return this.playersService.remove(id);
  }
}
