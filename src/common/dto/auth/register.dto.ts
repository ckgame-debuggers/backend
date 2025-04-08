import { IsNotEmpty, IsString, Length } from 'class-validator';

export default class RegisterDto {
  @IsNotEmpty()
  @IsString()
  username: string;

  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  @Length(1, 30)
  fullname: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  certCode: string;
}
