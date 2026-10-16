import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import {
  Between,
  FindOperator,
  FindOptionsOrder,
  FindOptionsWhere,
  ILike,
  LessThanOrEqual,
  MoreThanOrEqual,
  Repository,
} from 'typeorm';
import { CreatePlayerDto } from './dto/create-player.dto.js';
import { Paginated } from './dto/paginated.dto.js';
import { PlayerQueryDto, SortField } from './dto/player-query.dto.js';
import { UpdatePlayerDto } from './dto/update-player.dto.js';
import { Player } from './player.entity.js';

@Injectable()
export class PlayersService {
  constructor(
    @InjectRepository(Player)
    private readonly playerRepository: Repository<Player>,
  ) {}

  async findAll(query: PlayerQueryDto): Promise<Paginated<Player>> {
    const { page, limit } = query;
    const [data, total] = await this.playerRepository.findAndCount({
      where: this.buildWhere(query),
      order: this.buildOrder(query.sort),
      skip: (page - 1) * limit,
      take: limit,
    });
    return { data, total, page, limit };
  }

  async findOne(playerNo: number): Promise<Player> {
    const player = await this.playerRepository.findOneBy({ playerNo });
    if (!player) {
      throw new NotFoundException(`Player ${playerNo} not found`);
    }
    return player;
  }

  create(dto: CreatePlayerDto): Promise<Player> {
    return this.playerRepository.save(this.playerRepository.create(dto));
  }

  async update(playerNo: number, dto: UpdatePlayerDto): Promise<Player> {
    const player = await this.findOne(playerNo);
    return this.playerRepository.save(this.playerRepository.merge(player, dto));
  }

  async remove(playerNo: number): Promise<void> {
    const result = await this.playerRepository.delete({ playerNo });
    if (!result.affected) {
      throw new NotFoundException(`Player ${playerNo} not found`);
    }
  }

  private buildWhere(query: PlayerQueryDto): FindOptionsWhere<Player> {
    const where: FindOptionsWhere<Player> = {};
    if (query.name) where.name = ILike(`%${escapeLike(query.name)}%`);
    if (query.position) where.position = query.position;
    // Exact match, ignoring case.
    if (query.club) where.club = ILike(escapeLike(query.club));
    if (query.nationality) {
      where.nationality = ILike(escapeLike(query.nationality));
    }
    const age = range(query.minAge, query.maxAge);
    if (age) where.age = age;
    const rating = range(query.minRating, query.maxRating);
    if (rating) where.rating = rating;
    return where;
  }

  private buildOrder(sort = 'playerNo'): FindOptionsOrder<Player> {
    const descending = sort.startsWith('-');
    const field = (descending ? sort.slice(1) : sort) as SortField;
    const order: FindOptionsOrder<Player> = {
      [field]: descending ? 'DESC' : 'ASC',
    };
    // Tie-break on playerNo so pages are stable when sorting by a non-unique field.
    if (field !== 'playerNo') order.playerNo = 'ASC';
    return order;
  }
}

function range(min?: number, max?: number): FindOperator<number> | undefined {
  if (min !== undefined && max !== undefined) return Between(min, max);
  if (min !== undefined) return MoreThanOrEqual(min);
  if (max !== undefined) return LessThanOrEqual(max);
  return undefined;
}

// Treat user input literally rather than as LIKE wildcards.
function escapeLike(value: string): string {
  return value.replace(/[\\%_]/g, (char) => `\\${char}`);
}
