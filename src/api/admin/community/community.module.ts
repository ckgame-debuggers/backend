import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { PostModule } from './post/post.module';
import { QuestModule } from './quest/quest.module';
import { StoreModule } from './store/store.module';
import { CategoryModule } from './category/category.module';

@Module({
  controllers: [CommunityController],
  providers: [CommunityService],
  imports: [PostModule, QuestModule, StoreModule, CategoryModule]
})
export class CommunityModule {}
