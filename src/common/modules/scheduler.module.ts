import { Module } from '@nestjs/common';
import { ScheduleModule } from '@nestjs/schedule';
import { TypeOrmModule } from '@nestjs/typeorm';
import { RefreshTokenCleanupService } from '../services/refresh-token-cleanup.service';
import { CommunityPostCleanupService } from '../services/community-post-cleanup.service';
import { RefreshEntity } from '../entities/user/refresh.entity';
import { Oauth2RefreshTokenEntity } from '../entities/oauth2/refresh.entity';
import { CommunityPostEntity } from '../entities/community/post.entity';
import { SchedulerController } from '../controllers/scheduler.controller';

@Module({
  imports: [
    ScheduleModule.forRoot(),
    TypeOrmModule.forFeature([
      RefreshEntity,
      Oauth2RefreshTokenEntity,
      CommunityPostEntity,
    ]),
  ],
  controllers: [SchedulerController],
  providers: [RefreshTokenCleanupService, CommunityPostCleanupService],
  exports: [RefreshTokenCleanupService, CommunityPostCleanupService],
})
export class SchedulerModule {}
