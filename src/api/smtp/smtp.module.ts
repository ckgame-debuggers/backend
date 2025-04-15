import { Module } from '@nestjs/common';
import { SmtpService } from './smtp.service';
import { SmtpController } from './smtp.controller';
import { MailerModule, MailerOptions } from '@nestjs-modules/mailer';
import { ConfigService } from '@nestjs/config';

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (configService: ConfigService): MailerOptions => {
        return {
          transport: {
            host: configService.get<string>('MAIL_HOST'),
            port: configService.get<number>('MAIL_PORT'),
            secure: false,
            auth: {
              user: configService.get<string>('MAIL_USER'),
              pass: configService.get<string>('MAIL_PASS'),
            },
          },
          defaults: {
            from: configService.get<string>('MAIL_FROM'),
          },
        };
      },
    }),
  ],
  providers: [SmtpService],
  controllers: [SmtpController],
})
export class SmtpModule {}
