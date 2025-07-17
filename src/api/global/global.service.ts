import {
  ForbiddenException,
  Injectable,
  Logger,
  UnauthorizedException,
} from '@nestjs/common';
import { CreateBannerDto } from 'src/common/dto/global/create-banner.dto';
import { DebuggersBugEntity } from 'src/common/entities/debuggers/bug.entity';
import { BannerEntity } from 'src/common/entities/site-info/banner.entity';
import { RelatedSiteEntity } from 'src/common/entities/site-info/related-site.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class GlobalService {
  private readonly logger = new Logger(GlobalService.name);
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Retrieves all banners from the database.
   * Returns a result object containing the list of banners and status information.
   *
   * @returns {Promise<ResultType<BannerEntity[]>>} A result object with the banners, status, message, and timestamp.
   */
  async getAllBanners(): Promise<ResultType<BannerEntity[]>> {
    try {
      const bannerRepository = this.dataSource.getRepository(BannerEntity);
      const foundBanners = await bannerRepository.find();
      return {
        status: 'success',
        message: 'Banners fetched successfully.',
        timestamp: new Date(),
        data: foundBanners,
      };
    } catch (error) {
      this.logger.error('Failed to fetch banners', error.stack);
      return {
        status: 'failed',
        message: 'Failed to fetch banners.',
        timestamp: new Date(),
        data: [],
      };
    }
  }

  /**
   * Creates a new banner with the provided data and links it to the user.
   * Only users with administrator privileges (permission >= 3) are allowed to add a new banner.
   * Throws an UnauthorizedException if the user does not exist.
   * Throws a ForbiddenException if the user lacks sufficient permissions.
   *
   * @param {CreateBannerDto} createBannerDto - DTO containing the banner details.
   * @param {number} userId - The ID of the user attempting to create the banner.
   * @returns {Promise<ResultType<BannerEntity>>} A result object containing the created banner and status information.
   */
  async createBanners(
    createBannerDto: CreateBannerDto,
    userId: number,
  ): Promise<ResultType<BannerEntity>> {
    const bannerRepository = this.dataSource.getRepository(BannerEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    const user = await userRepository.findOneBy({
      id: userId,
    });

    if (!user)
      throw new UnauthorizedException(
        'You must login as administrator account to add new banner.',
      );

    if (user.permission < 3)
      throw new ForbiddenException(
        "You don't have permission to add new banner.",
      );

    const banner = bannerRepository.create({
      ...createBannerDto,
    });
    bannerRepository.save(banner);

    return {
      status: 'success',
      message: 'Banner created successfully.',
      timestamp: new Date(),
      data: banner,
    };
  }

  async getSolvedBugCount(): Promise<ResultType<number>> {
    const debugRepository = this.dataSource.getRepository(DebuggersBugEntity);
    const solvedCount = await debugRepository.count({
      where: {
        solved: true,
      },
    });
    return {
      status: 'success',
      message: 'Solved bug count fetched successfully.',
      timestamp: new Date(),
      data: solvedCount,
    };
  }

  async getRelatedSites(): Promise<ResultType<RelatedSiteEntity[]>> {
    const relatedRepository = this.dataSource.getRepository(RelatedSiteEntity);
    const found = await relatedRepository.find({});
    return {
      status: 'success',
      message: 'Related sites fetched successfully.',
      timestamp: new Date(),
      data: found,
    };
  }
}
