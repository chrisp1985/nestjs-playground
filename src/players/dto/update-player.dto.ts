import { PartialType } from '@nestjs/swagger';
import { CreatePlayerDto } from './create-player.dto.js';

// The @nestjs/swagger PartialType also marks the documented properties optional.
export class UpdatePlayerDto extends PartialType(CreatePlayerDto) {}
