import { Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommunityPostEntity } from './post.entity';
import { CommunityUserEntity } from './user.entity';

@Entity('community-scrap')
export class CommunityScrapEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @ManyToOne(() => CommunityPostEntity, (post) => post.scrap)
  post: CommunityPostEntity;

  @ManyToOne(() => CommunityUserEntity, (user) => user.scrap)
  user: CommunityUserEntity;
}
