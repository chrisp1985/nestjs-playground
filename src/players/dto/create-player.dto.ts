import { ApiProperty } from '@nestjs/swagger';
import {
  IsIn,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';
import { POSITIONS, type Position } from '../player.entity.js';

export class CreatePlayerDto {
  @ApiProperty({ example: 'Cole Palmer', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  name: string;

  @ApiProperty({ example: 24, type: 'integer', minimum: 15, maximum: 50 })
  @IsInt()
  @Min(15)
  @Max(50)
  age: number;

  @ApiProperty({
    example: 8.7,
    minimum: 0,
    maximum: 10,
    multipleOf: 0.1,
    description: 'At most one decimal place',
  })
  @IsNumber({ maxDecimalPlaces: 1 })
  @Min(0)
  @Max(10)
  rating: number;

  @ApiProperty({ enum: POSITIONS, example: 'MF' })
  @IsIn(POSITIONS)
  position: Position;

  @ApiProperty({ example: 'Chelsea', maxLength: 255 })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  club: string;

  @ApiProperty({
    example: 'England',
    maxLength: 255,
    description: 'National team the player represents',
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(255)
  nationality: string;
}
