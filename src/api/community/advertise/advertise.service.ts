import { Injectable, Logger } from '@nestjs/common';
import { CommunityAdvertiseEntity } from 'src/common/entities/community/advertise.entity';
import { DataSource, MoreThan } from 'typeorm';

@Injectable()
export class AdvertiseService {
  private readonly logger = new Logger(AdvertiseService.name);
  constructor(private readonly dataSource: DataSource) {}

  async getAdvertise(): Promise<ResultType<CommunityAdvertiseEntity | null>> {
    const advertisRepository = this.dataSource.getRepository(
      CommunityAdvertiseEntity,
    );
    const advertises = await advertisRepository.find({
      where: {
        expiresIn: MoreThan(new Date()),
      },
    });

    if (advertises.length === 0) {
      return {
        status: 'failed',
        message: 'No active advertisements found',
        data: null,
        timestamp: new Date(),
      };
    }

    const randomIndex = Math.floor(Math.random() * advertises.length);
    const selectedAd = advertises[randomIndex];

    return {
      status: 'success',
      message: 'Successfully retrieved advertisement',
      data: selectedAd,
      timestamp: new Date(),
    };
  }
}
