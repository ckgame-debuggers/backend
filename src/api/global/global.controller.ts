import {
  Controller,
  Get,
  Post,
  Body,
  Req,
  UseGuards,
  Request,
} from '@nestjs/common';
import { GlobalService } from './global.service';
import { CreateBannerDto } from 'src/common/dto/global/create-banner.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { User } from 'src/common/decorator/get-user';

@Controller('global')
export class GlobalController {
  constructor(private readonly globalService: GlobalService) {}

  @Get('banners')
  async getAllBanners() {
    return this.globalService.getAllBanners();
  }

  @UseGuards(AuthGuard)
  @Post('banners')
  async createBanner(
    @Body() createBannerDto: CreateBannerDto,
    @User('id') userId: number,
  ) {
    return this.globalService.createBanners(createBannerDto, userId);
  }

  @Get('solved-bug-count')
  async getSolvedBugCount() {
    return this.globalService.getSolvedBugCount();
  }

  @Get('related-sites')
  async getRelatedSite() {
    return this.globalService.getRelatedSites();
  }
}
