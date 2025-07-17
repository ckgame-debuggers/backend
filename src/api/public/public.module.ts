import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { Oauth2Module } from './oauth2/oauth2.module';
import { Oauth2ClientEntity } from 'src/common/entities/oauth2/client.entity';
import { Oauth2ScopeEntity } from 'src/common/entities/oauth2/scope.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';

@Module({
  imports: [Oauth2Module],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
