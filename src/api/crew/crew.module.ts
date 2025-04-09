import { Module } from '@nestjs/common';
import { CrewService } from './crew.service';
import { CrewController } from './crew.controller';
import { TypeOrmModule } from '@nestjs/typeorm';
import { CrewEntity } from 'src/common/entities/crew/crew.entity';
import { CrewMemberEntity } from 'src/common/entities/crew/crew-member.entity';
import { CrewApplicationEntity } from 'src/common/entities/crew/crew-application.entity';
import { CrewCreateRequestEntity } from 'src/common/entities/crew/crew-create-request.entity';
import { CrewServerEntity } from 'src/common/entities/crew/crew-server.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';

@Module({
  imports: [
    TypeOrmModule.forFeature([
      CrewEntity,
      CrewMemberEntity,
      CrewApplicationEntity,
      CrewCreateRequestEntity,
      CrewServerEntity,
      UserEntity,
    ]),
  ],
  providers: [CrewService],
  controllers: [CrewController],
})
export class CrewModule {}
