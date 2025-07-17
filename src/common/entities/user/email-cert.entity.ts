import {
  Column,
  Entity,
  Index,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from './user.entity';

@Entity('email-cert')
export class EmailCertEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  @Index()
  email: string;

  @Column({
    nullable: true,
    default: 'cert',
    enum: ['register', 'reset-password'],
  })
  type: 'register' | 'reset-password';

  @Column()
  value: string;
}
