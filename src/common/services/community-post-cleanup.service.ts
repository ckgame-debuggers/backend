import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { LessThan, Repository } from 'typeorm';
import { CommunityPostEntity } from '../entities/community/post.entity';

@Injectable()
export class CommunityPostCleanupService {
  private readonly logger = new Logger(CommunityPostCleanupService.name);

  constructor(
    @InjectRepository(CommunityPostEntity)
    private readonly postRepository: Repository<CommunityPostEntity>,
  ) {}

  @Cron(CronExpression.EVERY_DAY_AT_1AM)
  async purgeOldDeletedPosts(): Promise<void> {
    const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    try {
      const deletableCount = await this.postRepository.count({
        where: {
          isDeleted: true,
          deletedAt: LessThan(sevenDaysAgo),
        },
      });

      if (deletableCount === 0) {
        this.logger.debug('No soft-deleted posts older than 7 days');
        return;
      }

      const batchSize = 500;
      let totalDeleted = 0;
      let hasMore = true;

      while (hasMore) {
        const targets = await this.postRepository.find({
          where: { isDeleted: true, deletedAt: LessThan(sevenDaysAgo) },
          select: { id: true },
          take: batchSize,
        });

        if (targets.length === 0) {
          hasMore = false;
          break;
        }

        const ids = targets.map((p) => p.id);
        const result = await this.postRepository.delete(ids);
        totalDeleted += result.affected || 0;

        if (targets.length < batchSize) {
          hasMore = false;
        }
      }

      if (totalDeleted > 0) {
        this.logger.log(`Hard-deleted ${totalDeleted} posts older than 7 days`);
      }
    } catch (error) {
      this.logger.error('Failed to purge old soft-deleted posts', error);
    }
  }
}
