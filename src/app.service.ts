import { Injectable } from '@nestjs/common';

@Injectable()
export class AppService {
  getHealthCheck(): string {
    console.log('check +>>>>>>>>>>>>>>>>>,', process.env.JWT_SECRET);
    
    return 'Health check...';
  }
}
