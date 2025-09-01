import { IsNotEmpty, IsString, IsUrl } from 'class-validator';

export class AdminCreateBadgeDto {
  @IsNotEmpty()
  @IsString()
  title: string;

  @IsNotEmpty()
  @IsString()
  description: string;

  @IsNotEmpty()
  @IsUrl()
  image_id: string;
}
