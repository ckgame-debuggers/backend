import { Body, Controller, Get, Post } from '@nestjs/common';
import { CommunityService } from './community.service';
import { AdminCreateBadgeDto } from 'src/common/dto/admin/badge/create-badge.dto';

@Controller('admin/community')
export class CommunityController {
  constructor(private readonly communityService: CommunityService) {}

  @Post('badge')
  async createBadge(@Body() createBadgeDto: AdminCreateBadgeDto) {
    return this.communityService.createBadge(createBadgeDto);
  }
}
