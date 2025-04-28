import { Column, Entity, OneToMany, PrimaryGeneratedColumn } from 'typeorm';
import { DebuggersBugEntity } from './bug.entity';

@Entity('debuggers-category')
export class DebuggersCategoryEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @OneToMany(() => DebuggersBugEntity, (bug) => bug.category)
  bugs: DebuggersBugEntity[];
}
