import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { RefreshEntity } from '../entities/user/refresh.entity';
import { Oauth2RefreshTokenEntity } from '../entities/oauth2/refresh.entity';
import { SCHEDULER_CONFIG } from '../configs/scheduler.config';

@Injectable()
export class RefreshTokenCleanupService {
  private readonly logger = new Logger(RefreshTokenCleanupService.name);

  constructor(
    @InjectRepository(RefreshEntity)
    private readonly refreshTokenRepository: Repository<RefreshEntity>,
    @InjectRepository(Oauth2RefreshTokenEntity)
    private readonly oauth2RefreshTokenRepository: Repository<Oauth2RefreshTokenEntity>,
  ) {}

  @Cron(CronExpression.EVERY_30_MINUTES)
  async cleanupExpiredRefreshTokens() {
    try {
      const now = new Date();

      // 일반 refresh token 정리
      const expiredCount = await this.refreshTokenRepository.count({
        where: {
          exp: LessThan(now),
        },
      });

      if (expiredCount === 0) {
        this.logger.debug('No expired refresh tokens found to clean up');
      } else {
        await this.cleanupRefreshTokens(
          this.refreshTokenRepository,
          'refresh tokens',
          now,
        );
      }

      // OAuth2 refresh token 정리
      const expiredOauth2Count = await this.oauth2RefreshTokenRepository.count({
        where: {
          exp: LessThan(now),
        },
      });

      if (expiredOauth2Count === 0) {
        this.logger.debug('No expired OAuth2 refresh tokens found to clean up');
      } else {
        await this.cleanupRefreshTokens(
          this.oauth2RefreshTokenRepository,
          'OAuth2 refresh tokens',
          now,
        );
      }
    } catch (error) {
      this.logger.error('Failed to cleanup expired refresh tokens', error);
    }
  }

  private async cleanupRefreshTokens(
    repository: Repository<RefreshEntity | Oauth2RefreshTokenEntity>,
    tokenType: string,
    now: Date,
  ) {
    const batchSize = SCHEDULER_CONFIG.BATCH_SIZE;
    let totalDeleted = 0;
    let hasMore = true;

    while (hasMore) {
      // 배치 단위로 만료된 토큰들의 ID를 조회
      const expiredTokens = await repository
        .createQueryBuilder(
          repository === this.oauth2RefreshTokenRepository
            ? 'oauth2_refresh'
            : 'refresh',
        )
        .select(
          repository === this.oauth2RefreshTokenRepository
            ? 'oauth2_refresh.id'
            : 'refresh.id',
        )
        .where(
          repository === this.oauth2RefreshTokenRepository
            ? 'oauth2_refresh.exp < :now'
            : 'refresh.exp < :now',
          { now },
        )
        .limit(batchSize)
        .getMany();

      if (expiredTokens.length === 0) {
        hasMore = false;
        break;
      }

      const ids = expiredTokens.map((token) => token.id);
      const result = await repository.delete(ids);

      totalDeleted += result.affected || 0;

      if (expiredTokens.length < batchSize) {
        hasMore = false;
      }

      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (totalDeleted > 0) {
      this.logger.log(
        `Cleaned up ${totalDeleted} expired ${tokenType} at ${now.toISOString()}`,
      );
    }
  }

  // 수동으로 만료된 토큰들을 정리하는 메서드 (테스트용)
  async manualCleanup() {
    return this.cleanupExpiredRefreshTokens();
  }

  // 현재 만료된 토큰 개수를 확인하는 메서드
  async getExpiredTokensCount(): Promise<{ refresh: number; oauth2: number }> {
    const now = new Date();
    const refreshCount = await this.refreshTokenRepository.count({
      where: {
        exp: LessThan(now),
      },
    });
    const oauth2Count = await this.oauth2RefreshTokenRepository.count({
      where: {
        exp: LessThan(now),
      },
    });
    return { refresh: refreshCount, oauth2: oauth2Count };
  }
}
