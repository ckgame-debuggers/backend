import { IsEmail, IsNotEmpty, IsString } from 'class-validator';

export default class LoginDto {
  @IsNotEmpty()
  @IsString()
  email: string;

  @IsNotEmpty()
  @IsString()
  password: string;

  @IsNotEmpty()
  @IsString()
  deviceName: string;

  @IsNotEmpty()
  @IsString()
  location: string;
}
