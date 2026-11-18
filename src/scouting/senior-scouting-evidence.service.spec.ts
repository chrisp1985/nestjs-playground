import { Test } from '@nestjs/testing';
import { DataSource } from 'typeorm';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SeniorScoutingEvidenceService } from './senior-scouting-evidence.service.js';

describe('SeniorScoutingEvidenceService', () => {
  const subject = {
    sourcePlayerId: 8197,
    playerName: 'Erling Haaland',
    minutes: 2979,
    goals: 27,
    shots: 126,
    isSubject: true,
  };

  const peer = {
    sourcePlayerId: 9680,
    playerName: 'Ollie Watkins',
    minutes: 2908,
    goals: 16,
    shots: 83,
    isSubject: false,
  };

  const query = vi.fn();
  let service: SeniorScoutingEvidenceService;

  beforeEach(async () => {
    query.mockReset();

    const module = await Test.createTestingModule({
      providers: [
        SeniorScoutingEvidenceService,
        { provide: DataSource, useValue: { query } },
      ],
    }).compile();

    service = module.get(SeniorScoutingEvidenceService);
  });

  it('keeps the peer and adds per-90 rates to both rows', async () => {
    query.mockResolvedValue([subject, peer]);

    const result = await service.findEvidence(41, 269);

    expect(result).toHaveLength(2);
    expect(result?.[0]?.goalsPer90).toBeCloseTo(0.82);
    expect(result?.[1]?.sourcePlayerId).toBe(9680);
    expect(result?.[1]?.goalsPer90).toBeCloseTo(0.50);
  });

  it('returns null when only peer evidence is available', async () => {
    query.mockResolvedValue([peer]);

    const result = await service.findEvidence(41,269);

    expect(result).toBeNull();
  });
});