import { Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity('notice')
export class NoticeEntity {
  @PrimaryGeneratedColumn()
  id: number;
}
