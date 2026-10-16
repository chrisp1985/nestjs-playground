import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import { CreatePlayerDto } from './create-player.dto.js';
import { PlayerQueryDto } from './player-query.dto.js';
import { UpdatePlayerDto } from './update-player.dto.js';

async function errorsFor<T extends object>(
  cls: new () => T,
  plain: object,
): Promise<string[]> {
  const errors = await validate(plainToInstance(cls, plain));
  return errors.map((e) => e.property);
}

describe('CreatePlayerDto', () => {
  const valid = {
    name: 'Cole Palmer',
    age: 24,
    rating: 8.7,
    position: 'MF',
    club: 'Chelsea',
    nationality: 'England',
  };

  it('accepts a valid player', async () => {
    await expect(errorsFor(CreatePlayerDto, valid)).resolves.toEqual([]);
  });

  it('requires every field', async () => {
    await expect(errorsFor(CreatePlayerDto, {})).resolves.toEqual([
      'name',
      'age',
      'rating',
      'position',
      'club',
      'nationality',
    ]);
  });

  it('rejects out-of-range and malformed values', async () => {
    await expect(
      errorsFor(CreatePlayerDto, {
        ...valid,
        name: '',
        age: 24.5,
        rating: 8.75,
        position: 'ST',
      }),
    ).resolves.toEqual(['name', 'age', 'rating', 'position']);
    await expect(
      errorsFor(CreatePlayerDto, { ...valid, rating: 11 }),
    ).resolves.toEqual(['rating']);
  });
});

describe('UpdatePlayerDto', () => {
  it('allows partial updates but still validates provided fields', async () => {
    await expect(errorsFor(UpdatePlayerDto, { rating: 9 })).resolves.toEqual(
      [],
    );
    await expect(errorsFor(UpdatePlayerDto, { age: -1 })).resolves.toEqual([
      'age',
    ]);
  });
});

describe('PlayerQueryDto', () => {
  it('converts numeric query strings and applies defaults', () => {
    const dto = plainToInstance(PlayerQueryDto, {
      minAge: '20',
      minRating: '8.5',
    });

    expect(dto).toMatchObject({
      minAge: 20,
      minRating: 8.5,
      page: 1,
      limit: 20,
    });
  });

  it('accepts ascending and descending sort fields', async () => {
    await expect(
      errorsFor(PlayerQueryDto, { sort: 'rating' }),
    ).resolves.toEqual([]);
    await expect(errorsFor(PlayerQueryDto, { sort: '-age' })).resolves.toEqual(
      [],
    );
  });

  it('rejects unknown sort fields, bad positions and oversized pages', async () => {
    await expect(
      errorsFor(PlayerQueryDto, {
        sort: 'club',
        position: 'XX',
        limit: '500',
        page: '0',
        minAge: 'abc',
      }),
    ).resolves.toEqual(['position', 'minAge', 'sort', 'page', 'limit']);
  });
});
