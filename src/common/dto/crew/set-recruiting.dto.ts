import { IsBoolean, IsNotEmpty } from 'class-validator';

export class CrewSetRecruitingDto {
  @IsNotEmpty()
  @IsBoolean()
  isRecruiting: boolean;
}
