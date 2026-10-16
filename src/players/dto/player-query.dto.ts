import { ApiPropertyOptional } from '@nestjs/swagger';
import { Type } from 'class-transformer';
import {
  IsIn,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';
import { POSITIONS, type Position } from '../player.entity.js';

export const SORT_FIELDS = ['playerNo', 'name', 'age', 'rating'] as const;
export type SortField = (typeof SORT_FIELDS)[number];

// `sort=rating` sorts ascending, `sort=-rating` descending.
const SORT_VALUES = SORT_FIELDS.flatMap((field) => [field, `-${field}`]);

export class PlayerQueryDto {
  @ApiPropertyOptional({
    description: 'Case-insensitive partial match, e.g. `kane`',
  })
  @IsOptional()
  @IsString()
  name?: string;

  @ApiPropertyOptional({ enum: POSITIONS })
  @IsOptional()
  @IsIn(POSITIONS)
  position?: Position;

  @ApiPropertyOptional({
    description: 'Case-insensitive exact match, e.g. `arsenal`',
  })
  @IsOptional()
  @IsString()
  club?: string;

  @ApiPropertyOptional({
    description: 'Case-insensitive exact match, e.g. `england`',
  })
  @IsOptional()
  @IsString()
  nationality?: string;

  @ApiPropertyOptional({ type: 'integer', description: 'Inclusive' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  minAge?: number;

  @ApiPropertyOptional({ type: 'integer', description: 'Inclusive' })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  maxAge?: number;

  @ApiPropertyOptional({ description: 'Inclusive' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  minRating?: number;

  @ApiPropertyOptional({ description: 'Inclusive' })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  maxRating?: number;

  @ApiPropertyOptional({
    enum: SORT_VALUES,
    default: 'playerNo',
    description: 'Prefix with `-` for descending',
  })
  @IsOptional()
  @IsIn(SORT_VALUES)
  sort?: string;

  @ApiPropertyOptional({ type: 'integer', minimum: 1, default: 1 })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page: number = 1;

  @ApiPropertyOptional({
    type: 'integer',
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit: number = 20;
}
