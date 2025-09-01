import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { CommunityUserEntity } from './user.entity';

@Entity('community-alart')
export class CommunityAlartEntity {
  @PrimaryGeneratedColumn({ type: 'bigint' })
  id: number;

  @Column({ type: 'boolean', default: false })
  read: boolean;

  @Column({ type: 'timestamp' })
  createdAt: Date;

  @Column({ type: 'text' })
  content: string;

  @Column({ type: 'varchar' })
  writer: string;

  @ManyToOne(() => CommunityUserEntity, (target) => target.alarts)
  target: CommunityUserEntity;
}
