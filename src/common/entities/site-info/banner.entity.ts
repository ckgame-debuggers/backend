import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('site-banner')
export class BannerEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  desription: string;

  @Column()
  image: string;

  @Column()
  url: string;

  @Column()
  visible: boolean;
}
