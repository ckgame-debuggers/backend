import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Oauth2Controller } from './oauth2.controller';
import { Oauth2Service } from './oauth2.service';
import { Oauth2ClientEntity } from 'src/common/entities/oauth2/client.entity';
import { Oauth2ScopeEntity } from 'src/common/entities/oauth2/scope.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { JwtModule } from '@nestjs/jwt';
import { ConfigModule, ConfigService } from '@nestjs/config';

@Module({
  imports: [
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: async (configService: ConfigService) => ({
        secret: configService.get<string>('JWT_SECRET'),
      }),
      inject: [ConfigService],
      global: true,
    }),
  ],
  controllers: [Oauth2Controller],
  providers: [Oauth2Service],
})
export class Oauth2Module {}
