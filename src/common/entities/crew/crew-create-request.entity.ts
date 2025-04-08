import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';

@Entity('crew-create-request')
export class CrewCreateRequestEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  description: string;

  @ManyToOne(() => UserEntity, (user) => user)
  user: UserEntity;
}
