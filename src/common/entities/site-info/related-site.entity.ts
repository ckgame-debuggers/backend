import { Column, Entity, PrimaryGeneratedColumn } from 'typeorm';

@Entity('related-sites')
export class RelatedSiteEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  href: string;

  @Column()
  img: string;
}
