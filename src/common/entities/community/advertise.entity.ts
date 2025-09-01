import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('community-advertise')
export class CommunityAdvertiseEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  thumbnail: string;

  @Column()
  href: string;

  @Column({ type: 'date' })
  expiresIn: Date;
}
