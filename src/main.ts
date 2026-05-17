import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ExpressAdapter, NestExpressApplication } from '@nestjs/platform-express';
import { join } from 'path';
import { LoggingInterceptor } from './interceptor/logging.interceptor';
import { ValidationPipe, VERSION_NEUTRAL, VersioningType } from '@nestjs/common';
import morgan from 'morgan';
import helmet from 'helmet';
import { SharedModule } from './modules/shared/shared.module';
import { ServerConfigService } from './modules/shared/server-config.service';
import { SwaggerConfig } from './config/swagger';
import { GlobalExceptionFilter } from './filter/global.exception.filter';
import cookieParser from 'cookie-parser';

async function bootstrap(): Promise<NestExpressApplication> {
  const app = await NestFactory.create<NestExpressApplication>(
    AppModule,
    new ExpressAdapter(),
  );

  const serverConfig = app.select(SharedModule).get(ServerConfigService);
  const { port } = serverConfig.serverPort;

  // 1. Static assets
  app.useStaticAssets(join(__dirname, '..', 'public'));

  // 2. Security & cookie middleware
  app.use(helmet());
  app.use(cookieParser());

  // 3. CORS
  app.enableCors({
    origin: 'http://man-nguyen.com',
    credentials: true,
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    allowedHeaders: 'Content-Type, Accept, Authorization',
  });

  // 4. Global prefix
  app.setGlobalPrefix('api');

  // 5. Versioning
  app.enableVersioning({
    type: VersioningType.URI,
    defaultVersion: '1',
    prefix: 'v',  // /api/v1/
  });

  // 6. Global pipes
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

  // 7. Global interceptors & filters
  app.useGlobalInterceptors(new LoggingInterceptor());
  app.useGlobalFilters(new GlobalExceptionFilter());

  // 8. Logger
  app.use(morgan(serverConfig.nodeEnv === 'production' ? 'combined' : 'dev'));

  // 9. Swagger (sau cùng để nhận đủ metadata)
  if (serverConfig.swaggerEnabled) {
    SwaggerConfig(app);
  }

  await app.listen(port);

  return app;
}

bootstrap();
