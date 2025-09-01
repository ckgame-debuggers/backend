import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('global-image-records')
export class GlobalImageRecordEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  record_id: string;

  @Column({ default: false })
  uploaded: boolean;

  @Column()
  expires_in: Date;
}
