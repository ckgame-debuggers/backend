import { Module } from '@nestjs/common';
import { SmtpService } from './smtp.service';
import { SmtpController } from './smtp.controller';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      imports: [ConfigService],
      useFactory: (configService: ConfigService): MailerOptions => {
        return {
          transport: {
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
              user: '',
              pass: 'password',
            },
          },
          defaults: {
            from: `"DPUS" <dpus.noreply@gmail.com>`,
          },
        };
      },
    }),
  ],
  providers: [SmtpService],
  controllers: [SmtpController],
})
export class SmtpModule {}
