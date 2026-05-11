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
import { SharedModule } from './modules/shared/shared.module';
import { AuthModule } from './modules/auth/auth.module';
import { UsersModule } from './modules/users/users.module';
import { HrSessionModule } from './modules/hr-session/hr-session.module';
// import { McpHrModule } from './modules/mcp-hr/mcp-hr.module';
import { CmsModule } from './modules/cms/cms.module';
import { CmsCvModule } from './modules/cms-cv/cms-cv.module';
import { CmsRepoModule } from './modules/cms-repo/cms-repo.module';
import { CmsConvModule } from './modules/cms-conv/cms-conv.module';

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
    McpChatHistoryModule, 
    CookiesModule, 
    SharedModule,
    AuthModule,
    UsersModule,
    HrSessionModule,
    // McpHrModule,
    CmsModule,
    CmsCvModule,
    CmsRepoModule,
    CmsConvModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
