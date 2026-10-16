import { ApiProperty } from '@nestjs/swagger';
import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

export const POSITIONS = ['GK', 'DF', 'MF', 'FW'] as const;
export type Position = (typeof POSITIONS)[number];

@Entity('player')
export class Player {
  // BIGINT in the schema; returned as a number because of `parseInt8` in app.module.ts.
  @ApiProperty({ example: 1 })
  @PrimaryGeneratedColumn({ name: 'playerno', type: 'bigint' })
  playerNo: number;

  @ApiProperty({ example: 'Harry Kane' })
  @Column({ type: 'varchar' })
  name: string;

  @ApiProperty({ example: 32, type: 'integer' })
  @Column({ type: 'integer' })
  age: number;

  // pg returns DECIMAL as a string to avoid precision loss; ratings fit safely in a JS number.
  @ApiProperty({ example: 9.1 })
  @Column({
    type: 'decimal',
    precision: 10,
    scale: 1,
    transformer: {
      to: (value: number) => value,
      from: (value: string) => parseFloat(value),
    },
  })
  rating: number;

  @ApiProperty({ enum: POSITIONS, example: 'FW' })
  @Column({ type: 'varchar' })
  position: string;

  @ApiProperty({ example: 'Bayern Munich' })
  @Column({ type: 'varchar' })
  club: string;

  @ApiProperty({ example: 'England' })
  @Column({ type: 'varchar' })
  nationality: string;
}
