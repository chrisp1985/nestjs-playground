import { Injectable } from '@nestjs/common';

export interface Status {
  status: 'up';
}

@Injectable()
export class AppService {
  getStatus(): Status {
    return { status: 'up' };
  }

  getStatusCheck(): string {
    return 'Status Checked.';
  }
}
