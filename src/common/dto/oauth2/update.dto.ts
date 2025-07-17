import { IsNotEmpty, IsOptional, IsString } from 'class-validator';

export class UpdateOauth2Dto {
  @IsOptional()
  @IsString()
  @IsNotEmpty()
  title?: string;

  @IsOptional()
  @IsString()
  @IsNotEmpty()
  profile?: string;
}
