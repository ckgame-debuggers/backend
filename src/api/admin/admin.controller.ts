import {
  Body,
  Controller,
  Delete,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { User } from 'src/common/decorator/get-user';
import { AdminNoticeDto } from 'src/common/dto/admin/notice.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { AdminService } from './admin.service';
import { AdminEditAboutDto } from 'src/common/dto/admin/edit-about.dto';
import { AdminBannerDto } from 'src/common/dto/admin/banner.dto';

@Controller('admin')
export class AdminController {
  constructor(private readonly adminService: AdminService) {}

  @Post('/notice')
  @UseGuards(AuthGuard)
  async notice(@Body() noticeDto: AdminNoticeDto, @User('id') userId: number) {
    return await this.adminService.notice(noticeDto, userId);
  }

  @Delete('/notice')
  @UseGuards(AuthGuard)
  async deleteNotice(@Query('id') id: string, @User('id') userId: number) {
    return await this.adminService.deleteNotice({ id }, userId);
  }

  @Post('/about')
  @UseGuards(AuthGuard)
  async editAbout(
    @Body() aboutDto: AdminEditAboutDto,
    @User('id') userId: number,
  ) {
    return await this.adminService.editAbout(aboutDto, userId);
  }

  @Post('/banner')
  @UseGuards(AuthGuard)
  async banner(@Body() bannerDto: AdminBannerDto, @User('id') userId: number) {
    return await this.adminService.banner(bannerDto, userId);
  }
}
