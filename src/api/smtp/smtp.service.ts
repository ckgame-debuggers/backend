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

    if (user) {
      throw new ConflictException(
        `User with email ${getCodeDto.email} already exists`,
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
      this.logger.log(
        `Sending verify code to ${getCodeDto.email} with code ${cert}.`,
      );
      await this.mailerService.sendMail({
        to: getCodeDto.email,
        subject: '[디버거즈] 이메일을 인증해 주세요.',
        html: verifyEmailTemplate
          .replace(
            '$URL',
            `${process.env.FRONT_URL}/register/continue?email=${getCodeDto.email}&cert=${cert}`,
          )
          .replace('$MAIN_URL', `${process.env.FRONT_URL}/`),
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
