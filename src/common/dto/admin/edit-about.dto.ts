import { IsNotEmpty, IsString } from 'class-validator';

export class AdminEditAboutDto {
  @IsNotEmpty()
  @IsString()
  contents: string;
}
