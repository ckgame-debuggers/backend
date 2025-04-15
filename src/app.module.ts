import { Module } from '@nestjs/common';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './api/auth/auth.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { ConfigModule } from '@nestjs/config';
import { DatabaseConfigService } from './providers/database/database.config';
import { SmtpModule } from './api/smtp/smtp.module';
import { CrewModule } from './api/crew/crew.module';
import { DebuggersModule } from './api/debuggers/debuggers.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      isGlobal: true,
      envFilePath: process.env.NODE_ENV === 'dev' ? '.env.dev' : '.env',
    }),
    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useClass: DatabaseConfigService,
    }),
    AuthModule,
    SmtpModule,
    CrewModule,
    DebuggersModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
