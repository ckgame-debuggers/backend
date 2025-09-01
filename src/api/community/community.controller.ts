import { Controller, Get, Query, UseGuards } from '@nestjs/common';
import { CommunityService } from './community.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { User } from 'src/common/decorator/get-user';

@Controller('community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Get('/me')
  @UseGuards(AuthGuard)
  async getMyInfo(@User('id') userId: number) {
    return await this.communityService.getCommunityUserInfo(userId);
  }

  @Get('/recents')
  async getRecentPosts() {
    return await this.communityService.getAllRecentPosts();
  }

  @Get('/hot')
  async getHot(@Query('take') take?: number) {
    return await this.communityService.hot(take ?? 0);
  }
}
