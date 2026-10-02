import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('player')
export class Player {
  @PrimaryGeneratedColumn({ name: 'playerno' })
  playerNo: number;

  @Column({ type: 'varchar' })
  name: string;

  @Column({ type: 'integer' })
  age: number;

  // pg returns DECIMAL as a string to avoid precision loss; ratings fit safely in a JS number.
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

  @Column({ type: 'varchar' })
  position: string;
}
