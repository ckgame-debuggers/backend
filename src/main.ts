import './crypto-polyfill';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';
import { EnvConfigService } from './common/configs/env.config';
import { config } from 'dotenv';

async function bootstrap() {
  const logger = new Logger('Initializer');

  // Load .env file first
  config();

  const envConfig = new EnvConfigService();
  envConfig.validateEnvironment();

  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());

  let frontUrl = process.env.FRONT_URL;

  if (!frontUrl) {
    logger.error(
      'FRONT_URL environment variable is not set. CORS errors may occur.',
    );
  }

  app.enableCors({
    origin: [frontUrl],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    exposedHeaders: ['Content-Type', 'Authorization'],
  });
  logger.log(`CORS is enabled for ${frontUrl}.`);

  app.use(cookieParser());

  const port = process.env.PORT ?? 8080;
  await app.listen(port, '0.0.0.0', () => {
    logger.log(`Listening on port : ${port}`);
  });
}
bootstrap();
