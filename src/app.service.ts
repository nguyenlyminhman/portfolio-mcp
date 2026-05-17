import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {

  constructor() {

  }
  getHealthCheck(): string {
    console.log('check +>>>>>>>>>>>>>>>>>,', process.env.JWT_SECRET);
    return 'Health check...';
  }
}
