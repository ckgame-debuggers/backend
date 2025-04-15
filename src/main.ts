import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import cookieParser from 'cookie-parser';

async function bootstrap() {
  const app = await NestFactory.create(AppModule);
  app.useGlobalPipes(new ValidationPipe());
  app.use(cookieParser());

  app.enableCors({
    origin: [process.env.FRONT_URL, 'http://localhost:3000'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE,OPTIONS',
    credentials: true,
    exposedHeaders: ['Authorization'],
  });

  await app.listen(process.env.PORT ?? 8080, '0.0.0.0', () => {
    console.log(`서버가 ${process.env.PORT ?? 8080}번 포트에서 실행 중입니다.`);
  });
}
bootstrap();
