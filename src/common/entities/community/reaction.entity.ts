import {
  Column,
  Entity,
  Index,
  ManyToOne,
  PrimaryGeneratedColumn,
  Unique,
} from 'typeorm';
import { CommunityPostEntity } from './post.entity';
import { CommunityUserEntity } from './user.entity';

@Entity('community-post-reaction')
@Unique(['post', 'user'])
export class CommunityPostReactionEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @ManyToOne(() => CommunityPostEntity, { onDelete: 'CASCADE' })
  post: CommunityPostEntity;

  @ManyToOne(() => CommunityUserEntity, { onDelete: 'CASCADE' })
  user: CommunityUserEntity;

  // +1 for like, -1 for dislike
  @Column({ type: 'int' })
  value: number;

  @Column()
  createdAt: Date;

  @Column({ nullable: true })
  updatedAt?: Date;
}

