import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CommunityPostEntity } from './post.entity';
import { CommunityUserEntity } from './user.entity';

@Entity('community-comment')
export class CommunityCommentEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'text' })
  content: string;

  @Column({ default: false })
  isUnknown: boolean;

  @Column({ default: false })
  isDeleted: boolean;

  @Column()
  createdAt: Date;

  @Column({ nullable: true })
  updatedAt?: Date;

  @Column({ default: 0 })
  likes: number;

  @Column({ default: 0 })
  dislikes: number;

  // 게시글과의 관계
  @ManyToOne(() => CommunityPostEntity, { onDelete: 'CASCADE' })
  post: CommunityPostEntity;

  // 작성자와의 관계
  @ManyToOne(() => CommunityUserEntity)
  writer: CommunityUserEntity;

  // 부모 댓글 (답장 기능을 위한 자기 참조)
  @ManyToOne(() => CommunityCommentEntity, (comment) => comment.replies, {
    nullable: true,
    onDelete: 'CASCADE',
  })
  parent?: CommunityCommentEntity;

  // 자식 댓글들 (답장들)
  @OneToMany(() => CommunityCommentEntity, (comment) => comment.parent)
  replies: CommunityCommentEntity[];
}
