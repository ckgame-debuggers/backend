import { Module } from '@nestjs/common';
import { PublicController } from './public.controller';
import { PublicService } from './public.service';
import { Oauth2Module } from './oauth2/oauth2.module';

@Module({
  imports: [Oauth2Module],
  controllers: [PublicController],
  providers: [PublicService],
})
export class PublicModule {}
