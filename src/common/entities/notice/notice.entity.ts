import { Entity, PrimaryColumn, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class NoticeEntity {
  @PrimaryGeneratedColumn()
  id: number;
}
