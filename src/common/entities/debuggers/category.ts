import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class DebuggersCategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;
}
