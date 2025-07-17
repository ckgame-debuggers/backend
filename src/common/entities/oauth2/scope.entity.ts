import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Oauth2ToAgreeEntity } from './to-agree.entity';
import { Oauth2ConnectedEntity } from './connected.entity';

@Entity('oauth2-scope')
export class Oauth2ScopeEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  title: string;

  @Column()
  item: string;

  @ManyToMany(() => Oauth2ConnectedEntity, (connect) => connect.agreed)
  connected: Oauth2ConnectedEntity[];

  @OneToMany(() => Oauth2ToAgreeEntity, (toAgree) => toAgree.scope)
  toAgree: Oauth2ToAgreeEntity[];
}
