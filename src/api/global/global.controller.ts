import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Request,
  Query,
} from '@nestjs/common';
import { GlobalService } from './global.service';

@Controller('global')
export class GlobalController {
  constructor(private readonly globalService: GlobalService) {}

  @Get('about')
  async getAbout() {
    return this.globalService.getAbout();
  }
  @Get('banners')
  async getAllBanners() {
    return this.globalService.getAllBanners();
  }

  @Get('solved-bug-count')
  async getSolvedBugCount() {
    return this.globalService.getSolvedBugCount();
  }

  @Get('related-sites')
  async getRelatedSite() {
    return this.globalService.getRelatedSites();
  }

  @Get('notice')
  async getNotice(@Query('id') id: number) {
    return this.globalService.getNotice(id);
  }

  @Get('notices')
  async getNotices() {
    return this.globalService.getNotices();
  }

  @Get('infos')
  async getUserCount() {
    return this.globalService.getInfos();
  }
}
