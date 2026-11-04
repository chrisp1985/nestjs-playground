import { HttpService } from "@nestjs/axios";
import { BadGatewayException, GatewayTimeoutException, Injectable, NotFoundException, ServiceUnavailableException } from '@nestjs/common';
import { ScoutingResponse } from "./dto/scouting-response.dto.js";
import { firstValueFrom } from "rxjs";
import { isAxiosError } from 'axios';
import { setTimeout } from 'node:timers/promises';

@Injectable()
export class ScoutingService {
    constructor(private readonly httpService: HttpService) {}

    async findOne(playerNo: number): Promise<ScoutingResponse> {
        const signal = AbortSignal.timeout(3000);
        const url = `http://localhost:4000/scouting/${playerNo}`;
        for (let attempt = 1; attempt <= 3; attempt++) {
            if (signal.aborted) {
                throw new GatewayTimeoutException(
                'Scouting request deadline exceeded',
                );
            }

            try {
                const response = await firstValueFrom(
                    this.httpService.get<ScoutingResponse>( url, { timeout: 2000, signal }),
                );
                return response.data;            
            }
            catch (error: unknown) {
                if (signal.aborted) {
                    throw new GatewayTimeoutException( 'Scouting request deadline exceeded' );
                }
                if (isRetryable(error) && attempt < 3) {
                    try {
                        await awaitDelay(attempt, signal);
                    } catch (delayError: unknown) {
                        if (signal.aborted) {
                            throw new GatewayTimeoutException( 'Scouting request deadline exceeded',);
                        }
                        throw delayError;
                    }
                    continue;
                }
                else {
                    throw mappedException(error);
                }
            }
        }
        throw new BadGatewayException( 'Scouting service unavailable' );
    }
}

function isRetryable(error: unknown): boolean {
    if (!isAxiosError(error)) {
        return false;
    }

    const status = error.response?.status;

    if (status !== undefined) {
        return (
            status === 429 ||
            (status >= 500 && status <= 504)
        );
    }

    return [
        'ECONNABORTED',
        'ETIMEDOUT',
        'ECONNRESET',
        'ECONNREFUSED',
        ].includes(error.code ?? '');
}


async function awaitDelay(attempt: number, signal: AbortSignal): Promise<void> {
    const delayMs = 100 * 2 ** (attempt - 1);
    await setTimeout(delayMs, undefined, { signal });
}

function mappedException(error: unknown) {
    if (isAxiosError(error)) {
        switch (error.response?.status) {
            case 404:
                return new NotFoundException('Scouting report not found',);

            case 429:
                return new ServiceUnavailableException('Scouting service rate limited',);
        }

        if (
            error.code === 'ECONNABORTED' ||
            error.code === 'ETIMEDOUT'
            ) {
            return new GatewayTimeoutException(
                'Scouting service timed out',
            );
        }
    }

    return new BadGatewayException(
        'Scouting service unavailable',
    );
}