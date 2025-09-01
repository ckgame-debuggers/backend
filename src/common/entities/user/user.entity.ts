import {
  Column,
  Entity,
  Index,
  ManyToMany,
  OneToMany,
  OneToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { RefreshEntity } from './refresh.entity';
import { CrewMemberEntity } from '../crew/crew-member.entity';
import { CrewApplicationEntity } from '../crew/crew-application.entity';
import { CrewCreateRequestEntity } from '../crew/crew-create-request.entity';
import { DebuggersBugEntity } from '../debuggers/bug.entity';
import { DebuggersCommentEntity } from '../debuggers/comment.entity';
import { Oauth2ConnectedEntity } from '../oauth2/connected.entity';
import { CommunityUserEntity } from '../community/user.entity';

@Entity('users')
export class UserEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column({ length: 50 })
  username: string;

  @Column({ length: 100 })
  fullname: string;

  @Column({ unique: true, length: 20 })
  @Index()
  schoolNumber: string;

  @Column({ unique: true, length: 100 })
  @Index()
  email: string;

  @Column()
  password: string;

  @Column({ default: 'yellow' })
  color: string;

  @Column({
    nullable: true,
  })
  profile?: string;

  @Column({ default: 0 })
  permission: number;

  @Column({ length: 15, nullable: true })
  tel?: string;

  @Column({ type: 'enum', enum: ['male', 'female'], nullable: true })
  gender?: 'male' | 'female';

  @OneToOne(() => CommunityUserEntity, (communityInfo) => communityInfo.user)
  communityInfo: CommunityUserEntity;

  @OneToMany(() => Oauth2ConnectedEntity, (connected) => connected.user)
  connectedService: Oauth2ConnectedEntity[];

  @OneToMany(() => RefreshEntity, (refresh) => refresh.user)
  refreshTokens: RefreshEntity[];

  @OneToMany(() => DebuggersBugEntity, (bug) => bug.writer)
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
