import { Module } from '@nestjs/common';
import { CommunityController } from './community.controller';
import { CommunityService } from './community.service';
import { PostModule } from './post/post.module';
import { StoreModule } from './store/store.module';
import { AdvertiseModule } from './advertise/advertise.module';
import { QuestModule } from './quest/quest.module';
import { CommentModule } from './comment/comment.module';
import { CategoryModule } from './category/category.module';

@Module({
  controllers: [CommunityController],
  providers: [CommunityService],
  imports: [
    PostModule,
    StoreModule,
    AdvertiseModule,
    QuestModule,
    CommentModule,
    CategoryModule,
  ],
})
export class CommunityModule {}
