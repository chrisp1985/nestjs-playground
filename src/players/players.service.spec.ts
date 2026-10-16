import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { getRepositoryToken } from '@nestjs/typeorm';
import { Between, ILike, LessThanOrEqual, MoreThanOrEqual } from 'typeorm';
import { CreatePlayerDto } from './dto/create-player.dto.js';
import { PlayerQueryDto } from './dto/player-query.dto.js';
import { Player } from './player.entity.js';
import { PlayersService } from './players.service.js';

describe('PlayersService', () => {
  const kane: Player = {
    playerNo: 1,
    name: 'Harry Kane',
    age: 32,
    rating: 9.1,
    position: 'FW',
    club: 'Bayern Munich',
    nationality: 'England',
  };
  const repository = {
    findAndCount: vi.fn(),
    findOneBy: vi.fn(),
    create: vi.fn((dto: Partial<Player>) => ({ ...dto })),
    merge: vi.fn((entity: Player, dto: Partial<Player>) =>
      Object.assign(entity, dto),
    ),
    save: vi.fn((entity: Player) => Promise.resolve(entity)),
    delete: vi.fn(),
  };
  let service: PlayersService;

  const query = (overrides: Partial<PlayerQueryDto> = {}) =>
    Object.assign(new PlayerQueryDto(), overrides);

  beforeEach(async () => {
    vi.clearAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PlayersService,
        { provide: getRepositoryToken(Player), useValue: repository },
      ],
    }).compile();

    service = module.get(PlayersService);
  });

  describe('findAll', () => {
    it('defaults to page 1, 20 per page, ordered by playerNo', async () => {
      repository.findAndCount.mockResolvedValue([[kane], 1]);

      await expect(service.findAll(query())).resolves.toEqual({
        data: [kane],
        total: 1,
        page: 1,
        limit: 20,
      });
      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {},
        order: { playerNo: 'ASC' },
        skip: 0,
        take: 20,
      });
    });

    it('builds filters, descending sort with tie-break, and offset', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(
        query({
          name: 'kane',
          position: 'FW',
          club: 'arsenal',
          nationality: 'england',
          minAge: 20,
          maxAge: 30,
          minRating: 8.5,
          sort: '-rating',
          page: 3,
          limit: 10,
        }),
      );

      expect(repository.findAndCount).toHaveBeenCalledWith({
        where: {
          name: ILike('%kane%'),
          position: 'FW',
          club: ILike('arsenal'),
          nationality: ILike('england'),
          age: Between(20, 30),
          rating: MoreThanOrEqual(8.5),
        },
        order: { rating: 'DESC', playerNo: 'ASC' },
        skip: 20,
        take: 10,
      });
    });

    it('supports a max-only range and escapes LIKE wildcards', async () => {
      repository.findAndCount.mockResolvedValue([[], 0]);

      await service.findAll(query({ name: '50%_off', maxRating: 8 }));

      expect(repository.findAndCount).toHaveBeenCalledWith(
        expect.objectContaining({
          where: {
            name: ILike('%50\\%\\_off%'),
            rating: LessThanOrEqual(8),
          },
        }),
      );
    });
  });

  describe('findOne', () => {
    it('returns the player', async () => {
      repository.findOneBy.mockResolvedValue(kane);

      await expect(service.findOne(1)).resolves.toEqual(kane);
      expect(repository.findOneBy).toHaveBeenCalledWith({ playerNo: 1 });
    });

    it('throws NotFoundException when missing', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.findOne(999)).rejects.toThrow(NotFoundException);
    });
  });

  it('create saves a new entity', async () => {
    const { playerNo: _, ...rest } = kane;
    const dto = rest as CreatePlayerDto;

    await expect(service.create(dto)).resolves.toEqual(dto);
    expect(repository.save).toHaveBeenCalledWith(dto);
  });

  describe('update', () => {
    it('merges changes into the existing player', async () => {
      repository.findOneBy.mockResolvedValue({ ...kane });

      await expect(service.update(1, { rating: 9.3 })).resolves.toEqual({
        ...kane,
        rating: 9.3,
      });
    });

    it('throws NotFoundException when missing', async () => {
      repository.findOneBy.mockResolvedValue(null);

      await expect(service.update(999, { rating: 9.3 })).rejects.toThrow(
        NotFoundException,
      );
      expect(repository.save).not.toHaveBeenCalled();
    });
  });

  describe('remove', () => {
    it('deletes the player', async () => {
      repository.delete.mockResolvedValue({ affected: 1 });

      await expect(service.remove(1)).resolves.toBeUndefined();
      expect(repository.delete).toHaveBeenCalledWith({ playerNo: 1 });
    });

    it('throws NotFoundException when nothing was deleted', async () => {
      repository.delete.mockResolvedValue({ affected: 0 });

      await expect(service.remove(999)).rejects.toThrow(NotFoundException);
    });
  });
});
