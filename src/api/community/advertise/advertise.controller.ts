import { Controller, Get, Logger } from '@nestjs/common';
import { AdvertiseService } from './advertise.service';

@Controller('community/advertise')
export class AdvertiseController {
  private readonly logger = new Logger(AdvertiseController.name);
  constructor(private readonly advertiseService: AdvertiseService) {}

  @Get()
  async getAdvertise() {
    return await this.advertiseService.getAdvertise();
  }
}
