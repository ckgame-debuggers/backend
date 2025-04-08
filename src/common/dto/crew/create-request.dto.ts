import { IsNotEmpty, IsString } from 'class-validator';

export class CrewCreateReqDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;
}
