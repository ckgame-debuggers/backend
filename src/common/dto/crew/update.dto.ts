import { IsNotEmpty } from 'class-validator';
import { CrewEntity } from 'src/common/entities/crew/crew.entity';

export class CrewUpdateDto {
  @IsNotEmpty()
  to: CrewEntity;
}
