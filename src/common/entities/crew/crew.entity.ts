import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { CrewMemberEntity } from './crew-member.entity';
import { UserEntity } from '../user/user.entity';
import { CrewServerEntity } from './crew-server.entity';
import { CrewApplicationEntity } from './crew-application.entity';

@Entity('crew')
export class CrewEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @Column()
  maxPeople: number;

  @Column()
  isRecruiting: boolean;

  @Column()
  createdAt: string;

  @OneToMany(() => CrewMemberEntity, (crewMember) => crewMember.crew)
  members: CrewMemberEntity[];

  @OneToMany(() => CrewServerEntity, (server) => server.crew)
  server: CrewServerEntity[];

  @OneToMany(() => CrewApplicationEntity, (application) => application.crew)
  appplication: CrewApplicationEntity[];
}
