import { Module } from '@nestjs/common';
import { SocketGateway } from './socket.gateway';

@Module({
  controllers: [],
  providers: [SocketGateway]
})
export class SocketModule {}
