import { MailerService } from '@nestjs-modules/mailer';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { verifyEmailTemplate } from 'src/common/consts/smtp/templates/register';
import { resetPasswordTemplate } from 'src/common/consts/smtp/templates/reset-password';
import GetCodeDto from 'src/common/dto/cert/get-code.dto';
import { EmailCertEntity } from 'src/common/entities/user/email-cert.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name);
  constructor(
    private readonly mailerService: MailerService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Delete verification code after 5 minutes
   * @param email email to delete verification code for
   */
  private async deleteVerificationCodeAfterTimeout(
    email: string,
  ): Promise<void> {
    setTimeout(
      async () => {
        const certRepository = this.dataSource.getRepository(EmailCertEntity);
        const cert = await certRepository.findOneBy({ email });
        if (cert) {
          await certRepository.remove(cert);
          this.logger.log(
            `Deleted verification code for ${email} after 5 minutes`,
          );
        }
      },
      5 * 60 * 1000,
    );
  }

  /**
   * Generate new verify code for register
   * @param getCodeDto contains informations for create verify code.
   * @returns result for generate.
   */
  async generateVerifyCode(
    getCodeDto: GetCodeDto,
  ): Promise<ResultType<EmailCertEntity>> {
    const certRepository = this.dataSource.getRepository(EmailCertEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);
    const value = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(5, '0');

    if (!getCodeDto.email.endsWith('@chungkang.academy')) {
      throw new ForbiddenException('Email must ends with @chungkang.academy.');
    }

    const user = await userRepository.findOneBy({
      email: getCodeDto.email,
    });

    if (getCodeDto.type === 'register' && user) {
      throw new ConflictException(
        `User with email ${getCodeDto.email} already exists`,
      );
    } else if (getCodeDto.type && getCodeDto.type !== 'register' && !user) {
      throw new ConflictException(
        `User with email ${getCodeDto.email} not exists`,
      );
    }

    const oldVerifyCode = await certRepository.findBy({
      email: getCodeDto.email,
    });
    await certRepository.remove(oldVerifyCode);

    try {
      const generated = certRepository.create({
        email: getCodeDto.email,
        value,
        type: getCodeDto.type ?? 'register',
      });
      await certRepository.save(generated);

      this.deleteVerificationCodeAfterTimeout(getCodeDto.email);

      return {
        status: 'success',
        message: 'Successfully created new cert data.',
        data: generated,
        timestamp: new Date(),
      };
    } catch (error) {
      throw new ConflictException(error.message);
    }
  }

  /**
   * Send verify code to requesting user.
   * @param getCodeDto contains informations for create verify code.
   * @param cert cert number to send.
   * @returns result for send
   */
  async sendVerifyCode(
    getCodeDto: GetCodeDto,
    cert: string,
  ): Promise<ResultType> {
    try {
      this.logger.log(
        `Sending verify code to ${getCodeDto.email} with code ${cert}.`,
      );
      let template = '';
      if (getCodeDto.type === 'reset-password') {
        template = resetPasswordTemplate
          .replace(
            '$URL',
            `${process.env.FRONT_URL}/find/password/reset?email=${getCodeDto.email}&cert=${cert}`,
          )
          .replace('$MAIN_URL', `${process.env.FRONT_URL}/`);
      } else {
        template = verifyEmailTemplate
          .replace(
            '$URL',
            `${process.env.FRONT_URL}/register/continue?email=${getCodeDto.email}&cert=${cert}`,
          )
          .replace('$MAIN_URL', `${process.env.FRONT_URL}/`);
      }
      await this.mailerService.sendMail({
        to: getCodeDto.email,
        subject: '[디버거즈] 이메일을 인증해 주세요.',
        html: template,
      });
      return {
        status: 'success',
        message: `Successfully sent email to ${getCodeDto.email}`,
        timestamp: new Date(),
      };
    } catch (error) {
      this.logger.error(`Failed to send email for ${getCodeDto.email}.`, error);
      throw new ConflictException(error.message);
    }
  }
}
