import { Test, TestingModule } from '@nestjs/testing';
import { HttpService } from '@nestjs/axios';
import { of, throwError } from 'rxjs';
import { ScoutingService } from './scouting.service.js';
import type { ScoutingResponse } from './dto/scouting-response.dto.js';
import { AxiosError, AxiosHeaders, AxiosResponse } from 'axios';
import { GatewayTimeoutException, NotFoundException } from '@nestjs/common';

describe('ScoutingService', () => {
  let service: ScoutingService;

  const http = {
    get: vi.fn(),
  };

  beforeEach(async () => {
    vi.resetAllMocks();

    const module: TestingModule =
      await Test.createTestingModule({
        providers: [
          ScoutingService,
          {
            provide: HttpService,
            useValue: http,
          },
        ],
      }).compile();

    service = module.get(ScoutingService);
  });

  describe('findOne', () => {
    it('returns scouting information from the external API', async () => {
        const scouting: ScoutingResponse = {
            playerId: 1,
            potential: 95,
            report: 'Excellent attacking potential',
        };        

        const response = {
            data: scouting,
            status: 200,
            statusText: 'OK',
            headers: {},
            config: { headers: {} },
        };   

        http.get.mockReturnValue(of(response));   

        await expect(service.findOne(1)).resolves.toEqual(scouting);
        expect(http.get).toHaveBeenCalledOnce();
        expect(http.get).toHaveBeenCalledWith('http://localhost:4000/scouting/1',{ timeout: 2000, signal: expect.any(AbortSignal) },);
    });

    it('throws Network Unavailable when client call fails.', async () => {

        http.get.mockReturnValue(
            throwError(() => new Error('Scouting service unavailable')),
        );        
        await expect(service.findOne(1)).rejects.toThrow("Scouting service unavailable");
    });     
  });   

  describe('exceptions', () => {  
    it('throws an error when the timeout is exceeded.', async () => {
        const error = new AxiosError( 'timeout of 2000ms exceeded',  'ECONNABORTED', );

        http.get.mockReturnValue(
            throwError(() => error),
        );        

        await expect(service.findOne(1)).rejects.toThrow(GatewayTimeoutException);
        expect(http.get).toHaveBeenCalledTimes(3);
    });         
    
    it('maps upstream 404 to NotFoundException', async () => {
        http.get.mockReturnValue(
          throwError(() => axiosHttpError(404)),
        );

        await expect(service.findOne(34))
        .rejects.toThrow(NotFoundException);

        expect(http.get).toHaveBeenCalledExactlyOnceWith('http://localhost:4000/scouting/34',{ timeout: 2000, signal: expect.any(AbortSignal) },);      
    });       

    it('returns success after a retry for a 503', async () => {
      const scouting: ScoutingResponse = {
          playerId: 1,
          potential: 95,
          report: 'Excellent attacking potential',
      };        

      const response = {
          data: scouting,
          status: 200,
          statusText: 'OK',
          headers: {},
          config: { headers: {} },
      };       

      http.get
        .mockReturnValueOnce(throwError(() => axiosHttpError(503)))
        .mockReturnValueOnce(of(response));

      await expect(service.findOne(22)).resolves.toEqual(scouting);

      const firstConfig = http.get.mock.calls[0][1];
      const secondConfig = http.get.mock.calls[1][1];

      expect(firstConfig.signal).toBe(secondConfig.signal);
      expect(http.get).toHaveBeenCalledTimes(2);
      expect(http.get).toHaveBeenNthCalledWith(2, 'http://localhost:4000/scouting/22',{ timeout: 2000, signal: expect.any(AbortSignal) },);      
    });    
  });     
  
  it('maps an expired overall deadline to GatewayTimeoutException', async () => {
    const controller = new AbortController();

    const timeoutSpy = vi
      .spyOn(AbortSignal, 'timeout')
      .mockReturnValue(controller.signal);

    try {
      http.get.mockImplementation(() => {
        controller.abort();

        return throwError(
          () => new AxiosError(
            'Request cancelled',
            'ERR_CANCELED',
          ),
        );
      });

      await expect(service.findOne(1))
        .rejects.toThrow(GatewayTimeoutException);

      expect(http.get).toHaveBeenCalledOnce();
    } finally {
      timeoutSpy.mockRestore();
    }
  });
});

function axiosHttpError(status: number): AxiosError {
  const response: AxiosResponse = {
    data: {},
    status,
    statusText: 'Error',
    headers: {},
    config: {
      headers: new AxiosHeaders(),
    },
  };

  return new AxiosError(
    `HTTP ${status}`,
    undefined,
    undefined,
    undefined,
    response,
  );
}