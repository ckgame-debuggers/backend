import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenCleanupService } from '../services/refresh-token-cleanup.service';
import { RefreshEntity } from '../entities/user/refresh.entity';
import { Oauth2RefreshTokenEntity } from '../entities/oauth2/refresh.entity';
import { SchedulerController } from '../controllers/scheduler.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([RefreshEntity, Oauth2RefreshTokenEntity]),
  ],
  controllers: [SchedulerController],
  providers: [RefreshTokenCleanupService],
  exports: [RefreshTokenCleanupService],
})
export class SchedulerModule {}
