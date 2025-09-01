import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('global-data')
export class GlobalDataEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  value: string;
}
