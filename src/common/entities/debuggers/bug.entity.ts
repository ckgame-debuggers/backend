import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryColumn,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { DebuggersCommentEntity } from './comment.entity';
import { DebuggersCategoryEntity } from './category.entity';

@Entity('debuggers-bug')
export class DebuggersBugEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  contents: string;

  @Column()
  createdAt: string;

  @PrimaryColumn()
  index: number;

  @Column()
  solved: boolean;

  @Column()
  debuggersAnswer: string;

  @ManyToOne(() => DebuggersCategoryEntity, (category) => category.bugs)
  category: DebuggersCategoryEntity;

  @ManyToOne(() => UserEntity, (user) => user.bugs)
  writer: UserEntity;

  @OneToMany(() => DebuggersCommentEntity, (comment) => comment.bug)
  comments: DebuggersCommentEntity[];
}
