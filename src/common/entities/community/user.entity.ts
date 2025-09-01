import {
  Column,
  Entity,
  JoinColumn,
  ManyToMany,
  ManyToOne,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { CommunityScrapEntity } from './scrap.entity';
import { CommunityPostEntity } from './post.entity';
import { CommunityBadgeEntity } from './badge.entity';
import { CommunityAlartEntity } from './alart.entity';
import { CommunityCommentEntity } from './comment.entity';

@Entity('community-user')
export class CommunityUserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  exp: number;

  @Column()
  description: string;

  @Column({ default: 0 })
  point: number;

  @Column({ default: false })
  isBanned: boolean;

  @Column({ nullable: true })
  banExpireAt?: Date;

  @OneToOne(() => UserEntity, (user) => user.communityInfo)
  @JoinColumn()
  user: UserEntity;

  @OneToMany(() => CommunityPostEntity, (post) => post.writer)
  post: CommunityPostEntity;

  @OneToMany(() => CommunityScrapEntity, (scrap) => scrap.user)
  scrap: CommunityScrapEntity;

  @OneToMany(() => CommunityAlartEntity, (alart) => alart.target)
  alarts: CommunityAlartEntity[];

  @ManyToMany(() => CommunityBadgeEntity, (badge) => badge.user)
  badges: CommunityBadgeEntity[];

  @ManyToOne(() => CommunityBadgeEntity, (badge) => badge.defaults)
  defaultBadge: CommunityBadgeEntity;

  @OneToMany(() => CommunityCommentEntity, (comment) => comment.writer)
  comments: CommunityCommentEntity[];
}
