import {
  Column,
  Entity,
  JoinTable,
  ManyToMany,
  ManyToOne,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { Oauth2ClientEntity } from './client.entity';
import { Oauth2ScopeEntity } from './scope.entity';

@Entity('oauth2-connected')
export class Oauth2ConnectedEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  connectedAt: string;

  @ManyToOne(() => UserEntity, (user) => user.connectedService)
  user: UserEntity;

  @ManyToOne(() => Oauth2ClientEntity, (client) => client.connect)
  client: Oauth2ClientEntity;

  @ManyToMany(() => Oauth2ScopeEntity, (scope) => scope.connected)
  @JoinTable()
  agreed: Oauth2ScopeEntity[];
}
