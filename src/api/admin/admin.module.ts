import { Module } from '@nestjs/common';
import { AdminController } from './admin.controller';
import { AdminService } from './admin.service';
import { CommunityModule } from './community/community.module';

@Module({
  controllers: [AdminController],
  providers: [AdminService],
  imports: [CommunityModule]
})
export class AdminModule {}
