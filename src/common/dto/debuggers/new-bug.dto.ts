import { IsNotEmpty, IsNumber, IsString } from 'class-validator';

export class DebuggersNewBugDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsNumber()
  categoryId: number;

  @IsNotEmpty()
  @IsString()
  contents: string;
}
