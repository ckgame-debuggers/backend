import { Column, Entity, ManyToOne, PrimaryGeneratedColumn } from 'typeorm';
import { UserEntity } from '../user/user.entity';
import { Oauth2ClientEntity } from './client.entity';

@Entity('oauth2-refresh-token')
export class Oauth2RefreshTokenEntity {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  value: string;

  @Column()
  exp: Date;

  @ManyToOne(() => Oauth2ClientEntity, (client) => client.refreshToken)
  client: Oauth2ClientEntity;

  @ManyToOne(() => UserEntity, (user) => user.refreshTokens)
  user: UserEntity;
}
