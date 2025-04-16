import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity()
export class DebuggersBugEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  contents: string;

  @Column()
  debuggersAnswer: string;
}
