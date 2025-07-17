import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export default class ResetPasswordDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  certNumb: string;

  @IsNotEmpty()
  @IsString()
  toChange: string;
}
