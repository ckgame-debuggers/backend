import { IsNotEmpty, IsNumber } from 'class-validator';

export class CrewCreateDto {
  @IsNotEmpty()
  @IsNumber()
  id: number;
}
