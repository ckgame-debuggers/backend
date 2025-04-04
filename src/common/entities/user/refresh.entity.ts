import {
  Column,
  Entity,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('refresh')
export class RefreshEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value: string;

  @Column()
  exp: Date;

  @Column()
  deviceName: string;

  @Column()
  location: string;

  @ManyToOne(() => UserEntity, (user) => user.refreshTokens)
  user: UserEntity;
}
