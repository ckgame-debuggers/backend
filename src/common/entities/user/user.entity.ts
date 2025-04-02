import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

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

  @Column({ length: 15 })
  tel: string;

  @Column({ type: 'enum', enum: ['male', 'female'] })
  gender: 'male' | 'female';
}
