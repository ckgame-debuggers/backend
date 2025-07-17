import {
  Column,
  Entity,
  ManyToMany,
  ManyToOne,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Oauth2ClientEntity } from './client.entity';

@Entity('oauth2-redirect-url')
export class Oauth2RedirectUrlEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value: string;

  @ManyToOne(() => Oauth2ClientEntity, (client) => client.redirects)
  client: Oauth2ClientEntity;
}
