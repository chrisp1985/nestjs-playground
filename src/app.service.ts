import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getStatus(): string {
    return 'UP';
  }

  getStatusCheck(): string {
    return 'Status Checked.';
  }
}
