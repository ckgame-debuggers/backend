import {
  Entity,
  ManyToOne,
  PrimaryColumn,
  JoinColumn,
  PrimaryGeneratedColumn,
  Column,
} from 'typeorm';
import { Oauth2ScopeEntity } from './scope.entity';
import { Oauth2ClientEntity } from './client.entity';

@Entity('oauth2-to-agree')
export class Oauth2ToAgreeEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @ManyToOne(() => Oauth2ClientEntity, (client) => client)
  client: Oauth2ClientEntity;

  @ManyToOne(() => Oauth2ScopeEntity, (scope) => scope)
  scope: Oauth2ScopeEntity;

  @Column()
  isEssential: boolean;
}
