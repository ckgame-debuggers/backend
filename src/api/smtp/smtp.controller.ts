import { Body, Controller, Logger, Post } from '@nestjs/common';
import { SmtpService } from './smtp.service';
import GetCodeDto from 'src/common/dto/cert/get-code.dto';

@Controller('smtp')
export class SmtpController {
  private readonly logger = new Logger(SmtpController.name);
  constructor(private readonly smtpService: SmtpService) {}

  @Post('/cert')
  async sendEmailCertNumb(@Body() getCodeDto: GetCodeDto) {
    const code =
      (await this.smtpService.generateVerifyCode(getCodeDto)).data?.value || '';
    return await this.smtpService.sendVerifyCode(getCodeDto, code);
  }
}
