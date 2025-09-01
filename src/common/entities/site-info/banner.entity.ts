import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('global-banner')
export class BannerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  contents: string;

  @Column()
  image: string;

  @Column()
  url: string;

  @Column()
  visible: boolean;
}
