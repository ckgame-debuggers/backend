import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { Logger, ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const logger = new Logger('Initializer');
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());

  app.enableCors({
    origin: [process.env.FRONT_URL, 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    exposedHeaders: ['Authorization'],
  });

  logger.log('Enabled cors.');
  const port = process.env.PORT ?? 8080;
  await app.listen(port, '0.0.0.0', () => {
    logger.log(`Listening on port : ${port}`);
  });
}
bootstrap();
