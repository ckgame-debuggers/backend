import {
  Column,
  Entity,
  Index,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CommunityCategoryEntity } from './category.entity';
import { CommunityScrapEntity } from './scrap.entity';
import { CommunityUserEntity } from './user.entity';
import { CommunityBadgeEntity } from './badge.entity';
import { CommunityCommentEntity } from './comment.entity';

@Entity('community-post')
export class CommunityPostEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Index()
  @Column()
  title: string;

  @Column()
  content: string;

  @Column()
  permission: number;

  @Column()
  isUnknown: boolean;

  @Column()
  thumbnail?: string;

  @Column()
  createdAt: Date;

  @Column()
  isHot: boolean;

  @Column({ default: 0 })
  points: number;

  @Column({ default: false })
  isDeleted: boolean;

  @ManyToOne(() => CommunityBadgeEntity, (badge) => badge.posts, {
    nullable: true,
  })
  badge?: CommunityBadgeEntity;

  @OneToMany(() => CommunityScrapEntity, (scrap) => scrap.post)
  scrap: CommunityScrapEntity[];

  @ManyToOne(() => CommunityCategoryEntity, (category) => category.posts)
  category: CommunityCategoryEntity;

  @ManyToOne(() => CommunityUserEntity, (user) => user.post)
  writer: CommunityUserEntity;

  @OneToMany(() => CommunityCommentEntity, (comment) => comment.post)
  comments: CommunityCommentEntity[];
}
