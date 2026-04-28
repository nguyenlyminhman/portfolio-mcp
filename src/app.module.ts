import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { ChatModule } from './modules/chat/chat.module';
import { SocketModule } from './modules/socket/socket.module';
import { DbConnectModule } from './modules/db-connect/db-connect.module';
import { McpCvModule } from './modules/mcp-cv/mcp-cv.module';
import { McpGithubModule } from './modules/mcp-github/mcp-github.module';
import { McpChatHistoryModule } from './modules/mcp-chat-history/mcp-chat-history.module';
import { ConfigModule } from '@nestjs/config';
import { CookiesModule } from './modules/cookies/cookies.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: '.env',
      // load: [() => ({
      //   defaultLang: 'vi',
      // })],
    }),
    ChatModule, 
    SocketModule, 
    DbConnectModule, 
    McpCvModule, 
    McpGithubModule, 
    McpChatHistoryModule, CookiesModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
