import { Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class DebuggersBugEntity {
  @PrimaryGeneratedColumn()
  id: number;
}
