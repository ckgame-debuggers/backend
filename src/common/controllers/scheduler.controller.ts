import { Controller, Get, Post } from '@nestjs/common';
import { RefreshTokenCleanupService } from '../services/refresh-token-cleanup.service';

@Controller('scheduler')
export class SchedulerController {
  constructor(
    private readonly refreshTokenCleanupService: RefreshTokenCleanupService,
  ) {}

  @Post('cleanup-refresh-tokens')
  async manualCleanup() {
    await this.refreshTokenCleanupService.manualCleanup();
    return { message: 'Manual cleanup completed' };
  }

  @Get('expired-tokens-count')
  async getExpiredTokensCount() {
    const count = await this.refreshTokenCleanupService.getExpiredTokensCount();
    return { expiredTokensCount: count };
  }
}
