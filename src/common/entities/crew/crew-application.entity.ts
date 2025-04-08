import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CrewEntity } from './crew.entity';
import { UserEntity } from '../user/user.entity';

@Entity('crew-application')
export class CrewApplicationEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  contact: string;

  @Column()
  motivation: string;

  @ManyToOne(() => UserEntity, (user) => user.crewApplication)
  user: UserEntity;

  @ManyToOne(() => CrewEntity, (crew) => crew.appplication)
  crew: CrewEntity;
}
