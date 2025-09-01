import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { CommunityUserEntity } from './user.entity';
import { CommunityPostEntity } from './post.entity';

@Entity('community-badge')
export class CommunityBadgeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  img: string;

  @Column()
  isDefault: boolean;

  @ManyToMany(() => CommunityUserEntity, (user) => user)
  @JoinTable()
  user: CommunityUserEntity[];

  @OneToMany(() => CommunityPostEntity, (post) => post.badge)
  posts: CommunityPostEntity[];

  @OneToMany(() => CommunityUserEntity, (user) => user.defaultBadge)
  defaults: CommunityUserEntity[];
}
