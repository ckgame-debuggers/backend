import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { RefreshEntity } from './refresh.entity';
import { CrewMemberEntity } from '../crew/crew-member.entity';
import { CrewApplicationEntity } from '../crew/crew-application.entity';
import { CrewCreateRequestEntity } from '../crew/crew-create-request.entity';
import { DebuggersBugEntity } from '../debuggers/bug.entity';
import { DebuggersCommentEntity } from '../debuggers/comment.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  username: string;

  @Column({ length: 100 })
  fullname: string;

  @Column({ unique: true, length: 20 })
  schoolNumber: string;

  @Column({ length: 100 })
  email: string;

  @Column()
  password: string;

  @Column({ default: 0 })
  permission: number;

  @Column({ length: 15, nullable: true })
  tel?: string;

  @Column({ type: 'enum', enum: ['male', 'female'], nullable: true })
  gender?: 'male' | 'female';

  @OneToMany(() => RefreshEntity, (refresh) => refresh.user)
  refreshTokens: RefreshEntity[];

  @OneToMany(() => DebuggersBugEntity, (bug) => bug.user)
  bugs: DebuggersBugEntity[];

  @OneToMany(() => DebuggersCommentEntity, (comment) => comment.writer)
  bugComments: DebuggersCommentEntity[];

  @OneToMany(() => CrewMemberEntity, (crew) => crew.user)
  crew: CrewMemberEntity[];

  @OneToMany(() => CrewCreateRequestEntity, (req) => req.user)
  crewCreateRequest: CrewCreateRequestEntity[];

  @OneToMany(() => CrewApplicationEntity, (application) => application.user)
  crewApplication: CrewApplicationEntity[];
}
