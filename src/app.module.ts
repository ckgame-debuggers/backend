import './crypto-polyfill';
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
import { GlobalModule } from './api/global/global.module';
import { PublicModule } from './api/public/public.module';
import { ThrottlerModule } from '@nestjs/throttler';
import { SchedulerModule } from './common/modules/scheduler.module';
import { CommunityModule } from './api/community/community.module';
import { AdminModule } from './api/admin/admin.module';
import { CloudflareModule } from './providers/cloudflare/cloudflare.module';

@Module({
  imports: [
    ThrottlerModule.forRoot([
      {
        ttl: 60000,
        limit: 10,
      },
    ]),
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
    GlobalModule,
    PublicModule,
    SchedulerModule,
    CommunityModule,
    AdminModule,
    CloudflareModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
