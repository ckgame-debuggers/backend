import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CrewEntity } from './crew.entity';

@Entity('crew-server')
export class CrewServerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column({ type: 'enum', enum: ['kakaotalk', 'discord'] })
  type: 'kakaotalk' | 'discord';

  @Column()
  href: string;

  @ManyToOne(() => CrewEntity, (crew) => crew.server)
  crew: CrewEntity;
}
