import { MailerService } from '@nestjs-modules/mailer';
import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { verifyEmailTemplate } from 'src/common/consts/smtp/email-template';
import GetCodeDto from 'src/common/dto/cert/get-code.dto';
import { EmailCertEntity } from 'src/common/entities/user/email-cert.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class SmtpService {
  private readonly logger = new Logger(SmtpService.name);
  constructor(
    private readonly mailerService: MailerService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Generate new verify code for register
   * @param getCodeDto contains informations for create verify code.
   * @returns result for generate.
   */
  async generateVerifyCode(
    getCodeDto: GetCodeDto,
  ): Promise<ResultType<EmailCertEntity>> {
    const certRepository = this.dataSource.getRepository(EmailCertEntity);
    const value = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(5, '0');

    if (!getCodeDto.email.endsWith('@chungkang.academy')) {
      throw new ForbiddenException('Email must ends with @chungkang.academy.');
    }

    try {
      const generated = certRepository.create({
        email: getCodeDto.email,
        value,
      });
      await certRepository.save(generated);
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
      await this.mailerService.sendMail({
        to: getCodeDto.email,
        subject: '[디버거즈] 이메일을 인증해 주세요.',
        html: verifyEmailTemplate.replace(
          '$link',
          `https://ckgamelab.com/register/continue?email=${getCodeDto.email}&cert=${cert}`,
        ),
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
