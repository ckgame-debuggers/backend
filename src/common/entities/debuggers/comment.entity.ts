import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { DebuggersBugEntity } from './bug.entity';
import { UserEntity } from '../user/user.entity';

@Entity('debuggers-comment')
export class DebuggersCommentEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contents: string;

  @Column()
  createdAt: string;

  @ManyToOne(() => UserEntity, (user) => user.bugComments)
  writer: UserEntity;

  @ManyToOne(() => DebuggersBugEntity, (bug) => bug.comments)
  bug: DebuggersBugEntity;
}
