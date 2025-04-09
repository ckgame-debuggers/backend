import { Column, Entity, ManyToOne, PrimaryColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { CrewEntity } from './crew.entity';

@Entity('crew-member')
export class CrewMemberEntity {
  @PrimaryColumn()
  userId: number;

  @PrimaryColumn()
  crewId: number;

  @ManyToOne(() => UserEntity, (user) => user.crew)
  user: UserEntity;

  @ManyToOne(() => CrewEntity, (crew) => crew.members)
  crew: CrewEntity;

  @Column({
    type: 'enum',
    enum: ['Owner', 'Sub-Owner', 'Member'],
  })
  permission: 'Owner' | 'Sub-Owner' | 'Member';
}
