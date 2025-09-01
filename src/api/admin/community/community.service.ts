import { Injectable, Logger } from '@nestjs/common';
import { AdminCreateBadgeDto } from 'src/common/dto/admin/badge/create-badge.dto';
import { CommunityBadgeEntity } from 'src/common/entities/community/badge.entity';
import { CloudflareService } from 'src/providers/cloudflare/cloudflare.service';
import { DataSource } from 'typeorm';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly cloudflareService: CloudflareService,
  ) {}

  async createBadge(
    createBadgeDto: AdminCreateBadgeDto,
  ): Promise<ResultType<CommunityBadgeEntity>> {
    const badgeRepository = this.dataSource.getRepository(CommunityBadgeEntity);
    const image = await this.cloudflareService.getImageUrl(
      createBadgeDto.image_id,
    );

    const newBadge = badgeRepository.create({
      title: createBadgeDto.title,
      description: createBadgeDto.description,
      img: createBadgeDto.image_id,
    });

    await badgeRepository.save(newBadge);
    return {
      status: 'success',
      timestamp: new Date(),
      data: newBadge,
      message: 'Successfully created new badge',
    };
  }
}
