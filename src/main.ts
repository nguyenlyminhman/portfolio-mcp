import 'dotenv/config'; 
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { LoggingInterceptor } from './interceptor/logging.interceptor';
import { ValidationPipe } from '@nestjs/common';
import * as morgan from 'morgan';
import helmet from 'helmet';
import { SharedModule } from './modules/shared/shared.module';
import { ServerConfigService } from './modules/shared/server-config.service';
import { SwaggerConfig } from './config/swagger';


async function bootstrap(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
    { cors: true }
  );

  const serverConfig = app.select(SharedModule).get(ServerConfigService);
  const { port } = serverConfig.serverPort;

  app.useStaticAssets(join(__dirname, '..', 'public'));
  app.use(helmet());

  app.useGlobalInterceptors( new LoggingInterceptor() );
  app.enableCors({
  // Thay bằng domain chính xác của bạn, không dùng '*'
  origin: ['http://localhost:3001', 'http://localhost:3001/documentation'], 
  credentials: true, // Cho phép nhận và gửi Cookie
  methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
});

  app.setGlobalPrefix('/api');
  app.useGlobalPipes(
    new ValidationPipe({
      whitelist: true,
      forbidNonWhitelisted: false,
      transform: true,
      transformOptions: {
        enableImplicitConversion: true,
      },
    }),
  );
  app.use(morgan('combined'));
  app.enableVersioning();
  // Microservice config here


  // Setup swagger
  if (serverConfig.swaggerEnabled) {
    SwaggerConfig(app);
  }
  // Set global prefix for endpoint


  await app.listen(port);

  return app;
}

bootstrap();

