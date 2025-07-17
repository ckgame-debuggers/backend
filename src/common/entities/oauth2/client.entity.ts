import {
  Column,
  Entity,
  ManyToMany,
  OneToMany,
  PrimaryGeneratedColumn,
} from 'typeorm';
import { Oauth2ToAgreeEntity } from './to-agree.entity';
import { Oauth2ConnectedEntity } from './connected.entity';
import { Oauth2RefreshTokenEntity } from './refresh.entity';
import { Oauth2RedirectUrlEntity } from './redirec-url.entity';

@Entity('oauth2-client')
export class Oauth2ClientEntity {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column()
  title: string;

  @Column()
  profile: string;

  @Column()
  secret: string;

  @Column({ default: false })
  useOauth: boolean;

  @OneToMany(() => Oauth2ConnectedEntity, (connect) => connect.client)
  connect: Oauth2ConnectedEntity[];

  @OneToMany(() => Oauth2RefreshTokenEntity, (refresh) => refresh.client)
  refreshToken: Oauth2RefreshTokenEntity[];

  @OneToMany(() => Oauth2ToAgreeEntity, (toAgree) => toAgree.client)
  toAgree: Oauth2ToAgreeEntity[];

  @OneToMany(() => Oauth2RedirectUrlEntity, (redirects) => redirects.client)
  redirects: Oauth2RedirectUrlEntity[];
}
