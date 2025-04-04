import { Controller, Logger } from '@nestjs/common';
import { SmtpService } from './smtp.service';

@Controller('smtp')
export class SmtpController {
  private readonly logger = new Logger(SmtpController.name);
  constructor(private readonly smtpService: SmtpService) {}
}
