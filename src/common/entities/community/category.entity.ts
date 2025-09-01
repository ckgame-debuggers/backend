import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CommunityPostEntity } from './post.entity';

@Entity('community-category')
export class CommunityCategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column({ default: 0 })
  permission: 0;

  @OneToMany(() => CommunityPostEntity, (post) => post.category)
  posts: CommunityPostEntity[];
}
