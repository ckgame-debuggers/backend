import { Module } from '@nestjs/common';
import { CrewService } from './crew.service';
import { CrewController } from './crew.controller';

@Module({
  providers: [CrewService],
  controllers: [CrewController]
})
export class CrewModule {}
