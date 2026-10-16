import { Test, TestingModule } from '@nestjs/testing';
import { CreatePlayerDto } from './dto/create-player.dto.js';
import { PlayerQueryDto } from './dto/player-query.dto.js';
import { Player } from './player.entity.js';
import { PlayersController } from './players.controller.js';
import { PlayersService } from './players.service.js';

describe('PlayersController', () => {
  const kane: Player = {
    playerNo: 1,
    name: 'Harry Kane',
    age: 32,
    rating: 9.1,
    position: 'FW',
    club: 'Bayern Munich',
    nationality: 'England',
  };
  const service = {
    findAll: vi.fn(),
    findOne: vi.fn(),
    create: vi.fn(),
    update: vi.fn(),
    remove: vi.fn(),
  };
  let playersController: PlayersController;

  beforeEach(async () => {
    vi.resetAllMocks();
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayersController],
      providers: [{ provide: PlayersService, useValue: service }],
    }).compile();

    playersController = module.get<PlayersController>(PlayersController);
  });

  it('findAll passes the query through and returns the page', async () => {
    const query = Object.assign(new PlayerQueryDto(), { position: 'FW' });
    const page = { data: [kane], total: 1, page: 1, limit: 20 };
    service.findAll.mockResolvedValue(page);

    await expect(playersController.findAll(query)).resolves.toEqual(page);
    expect(service.findAll).toHaveBeenCalledWith(query);
  });

  it('findOne returns the player', async () => {
    service.findOne.mockResolvedValue(kane);

    await expect(playersController.findOne(1)).resolves.toEqual(kane);
    expect(service.findOne).toHaveBeenCalledWith(1);
  });

  it('create returns the saved player', async () => {
    const { playerNo: _, ...dto } = kane;
    service.create.mockResolvedValue(kane);

    await expect(
      playersController.create(dto as CreatePlayerDto),
    ).resolves.toEqual(kane);
    expect(service.create).toHaveBeenCalledWith(dto);
  });

  it('update returns the updated player', async () => {
    service.update.mockResolvedValue({ ...kane, rating: 9.2 });

    await expect(
      playersController.update(1, { rating: 9.2 }),
    ).resolves.toMatchObject({ rating: 9.2 });
    expect(service.update).toHaveBeenCalledWith(1, { rating: 9.2 });
  });

  it('remove delegates to the service', async () => {
    service.remove.mockResolvedValue(undefined);

    await playersController.remove(1);
    expect(service.remove).toHaveBeenCalledWith(1);
  });
});
