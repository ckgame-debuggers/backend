import { IsEmail, IsNotEmpty } from 'class-validator';
import { EmailCertEntity } from 'src/common/entities/user/email-cert.entity';

export default class GetCodeDto {
  @IsNotEmpty()
  @IsEmail()
  email: string;

  type?: 'register' | 'reset-password';
}
