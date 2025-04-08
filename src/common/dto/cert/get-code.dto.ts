import { IsEmail, IsNotEmpty } from 'class-validator';

export default class GetCodeDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;
}
