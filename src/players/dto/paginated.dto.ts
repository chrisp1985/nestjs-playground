import { ApiProperty } from '@nestjs/swagger';
import { Player } from '../player.entity.js';

export interface Paginated<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
}

// Concrete class so Swagger can describe the response; generics are erased at runtime.
export class PaginatedPlayersDto implements Paginated<Player> {
  @ApiProperty({ type: [Player] })
  data: Player[];

  @ApiProperty({
    example: 50,
    description: 'Matching players across all pages',
  })
  total: number;

  @ApiProperty({ example: 1 })
  page: number;

  @ApiProperty({ example: 20 })
  limit: number;
}
