import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class CrewApplicationDto {
  @IsNotEmpty()
  @IsNumber()
  crewId: number;

  @IsNotEmpty()
  @IsString()
  contact: string;

  @IsNotEmpty()
  @IsString()
  motivation: string;
}
