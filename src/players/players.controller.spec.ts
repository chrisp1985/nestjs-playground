import { Test, TestingModule } from '@nestjs/testing';
import { Player } from './player.entity.js';
import { PlayersController } from './players.controller.js';
import { PlayersService } from './players.service.js';

describe('PlayersController', () => {
  const players: Player[] = [
    { playerNo: 1, name: 'Harry Kane', age: 32, rating: 9.1, position: 'FW' },
    {
      playerNo: 2,
      name: 'Jude Bellingham',
      age: 22,
      rating: 9.0,
      position: 'MF',
    },
  ];
  let playersController: PlayersController;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [PlayersController],
      providers: [
        {
          provide: PlayersService,
          useValue: { findAll: () => Promise.resolve(players) },
        },
      ],
    }).compile();

    playersController = module.get<PlayersController>(PlayersController);
  });

  it('should return all players from the service', async () => {
    await expect(playersController.findAll()).resolves.toEqual(players);
  });
});
