import { IsBoolean, IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CrewCreateReqDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsNumber()
  maxPeople: number;

  @IsNotEmpty()
  @IsBoolean()
  isRecruiting: boolean;
}
