import { Body, Controller, Get, Post } from '@nestjs/common';
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {}

  @Get()
  getHello(): string {
    return this.appService.getHello();
  }

  @Get('upload-image')
  getImageUploadUrl() {
    return this.appService.getImageUploadUrl();
  }

  @Post('upload-image')
  setUploadImage(@Body() { id }: { id: string }) {
    return this.appService.setUpload(id);
  }
}
