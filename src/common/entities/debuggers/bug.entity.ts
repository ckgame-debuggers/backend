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

@Entity()
export class DebuggersBugEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  contents: string;

  @PrimaryColumn()
  index: number;

  @ManyToOne(() => UserEntity, (user) => user.bugs)
  user: UserEntity;

  @OneToMany(() => DebuggersCommentEntity, (comment) => comment.bug)
  comments: DebuggersCommentEntity[];

  @Column()
  debuggersAnswer: string;
}
