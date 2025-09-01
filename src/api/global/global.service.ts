import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { CrewEntity } from 'src/common/entities/crew/crew.entity';
import { DebuggersBugEntity } from 'src/common/entities/debuggers/bug.entity';
import { GlobalDataEntity } from 'src/common/entities/global/data.entity';
import { NoticeEntity } from 'src/common/entities/global/notice.entity';
import { BannerEntity } from 'src/common/entities/site-info/banner.entity';
import { RelatedSiteEntity } from 'src/common/entities/site-info/related-site.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { DataSource } from 'typeorm';

/**
 * Service handling global application functionalities
 */
@Injectable()
export class GlobalService {
  private readonly logger = new Logger(GlobalService.name);
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Retrieves the about page content from global data
   * If no content exists, initializes with empty string
   *
   * @returns {Promise<ResultType<string>>} A result object containing the about page content
   */
  async getAbout(): Promise<ResultType<string>> {
    this.logger.log('Fetching about page from global data');
    const dataRepository = this.dataSource.getRepository(GlobalDataEntity);
    let data = await dataRepository.findOneBy({
      title: 'ckdebuggers_about',
    });
    if (!data) {
      this.logger.debug('Services count not found, initializing with 0');
      data = dataRepository.create({
        title: 'ckdebuggers_about',
        value: '',
      });
      await dataRepository.save(data);
    }
    return {
      status: 'success',
      message: 'Service count fetched successfully.',
      timestamp: new Date(),
      data: data.value,
    };
  }

  /**
   * Retrieves all banners from the database.
   * Returns a result object containing the list of banners and status information.
   *
   * @returns {Promise<ResultType<BannerEntity[]>>} A result object with the banners, status, message, and timestamp.
   */
  async getAllBanners(): Promise<ResultType<BannerEntity[]>> {
    try {
      this.logger.log('Attempting to fetch all banners from database');
      const bannerRepository = this.dataSource.getRepository(BannerEntity);
      const foundBanners = await bannerRepository.findBy({ visible: true });
      this.logger.debug(
        `Successfully retrieved ${foundBanners.length} banners`,
      );
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
   * Retrieves the count of solved bugs from the debuggers repository
   * @returns {Promise<ResultType<number>>} A result object containing the count of solved bugs
   */
  async getSolvedBugCount(): Promise<ResultType<number>> {
    this.logger.log('Fetching count of solved bugs');
    const debugRepository = this.dataSource.getRepository(DebuggersBugEntity);
    const solvedCount = await debugRepository.count({
      where: {
        solved: true,
      },
    });
    this.logger.debug(`Found ${solvedCount} solved bugs`);
    return {
      status: 'success',
      message: 'Solved bug count fetched successfully.',
      timestamp: new Date(),
      data: solvedCount,
    };
  }

  /**
   * Retrieves all related sites from the database
   * @returns {Promise<ResultType<RelatedSiteEntity[]>>} A result object containing the list of related sites
   */
  async getRelatedSites(): Promise<ResultType<RelatedSiteEntity[]>> {
    this.logger.log('Fetching all related sites');
    const relatedRepository = this.dataSource.getRepository(RelatedSiteEntity);
    const found = await relatedRepository.find({});
    this.logger.debug(`Retrieved ${found.length} related sites`);
    return {
      status: 'success',
      message: 'Related sites fetched successfully.',
      timestamp: new Date(),
      data: found,
    };
  }

  /**
   * Retrieves all notices from the database
   * @returns {Promise<ResultType<NoticeEntity[]>>} A result object containing the list of notices
   */
  async getNotice(id: number): Promise<ResultType<NoticeEntity>> {
    this.logger.log(`Fetching notice with ID: ${id}`);
    const noticeRepository = this.dataSource.getRepository(NoticeEntity);
    const found = await noticeRepository.findOneBy({ id });
    if (!found) {
      this.logger.warn(`Notice with ID ${id} not found`);
      throw new NotFoundException('Notice item not found.');
    }
    this.logger.debug(`Successfully retrieved notice with ID: ${id}`);
    return {
      status: 'success',
      message: 'Notices fetched successfully.',
      timestamp: new Date(),
      data: found,
    };
  }

  /**
   * Retrieves all notices from the database
   * @returns {Promise<ResultType<NoticeEntity[]>>} A result object containing the list of notices
   */
  async getNotices(): Promise<ResultType<NoticeEntity[]>> {
    this.logger.log('Fetching all notices');
    const noticeRepository = this.dataSource.getRepository(NoticeEntity);
    const found = await noticeRepository.find({});
    this.logger.debug(`Retrieved ${found.length} notices`);
    return {
      status: 'success',
      message: 'Notices fetched successfully.',
      timestamp: new Date(),
      data: found,
    };
  }

  /**
   * Gets the total count of users in the system
   * @returns {Promise<ResultType<number>>} A result object containing the total user count
   */
  async userCount(): Promise<ResultType<number>> {
    this.logger.log('Fetching total user count');
    const userRepository = this.dataSource.getRepository(UserEntity);
    const count = await userRepository.count({});
    this.logger.debug(`Total user count: ${count}`);
    return {
      status: 'success',
      message: 'User count fetched successfully.',
      timestamp: new Date(),
      data: count,
    };
  }

  /**
   * Retrieves or initializes the services count from global data
   * @returns {Promise<ResultType<string>>} A result object containing the services count
   */
  async ServiceCount(): Promise<ResultType<string>> {
    this.logger.log('Fetching services count from global data');
    const dataRepository = this.dataSource.getRepository(GlobalDataEntity);
    let data = await dataRepository.findOneBy({
      title: 'services_count',
    });
    if (!data) {
      this.logger.debug('Services count not found, initializing with 0');
      data = dataRepository.create({
        title: 'services_count',
        value: '0',
      });
      await dataRepository.save(data);
    }
    this.logger.debug(`Current services count: ${data.value}`);
    return {
      status: 'success',
      message: 'Service count fetched successfully.',
      timestamp: new Date(),
      data: data.value,
    };
  }

  /**
   * Retrieves or initializes the events count from global data
   * @returns {Promise<ResultType<string>>} A result object containing the events count
   */
  async EventsCount(): Promise<ResultType<string>> {
    this.logger.log('Fetching events count from global data');
    const dataRepository = this.dataSource.getRepository(GlobalDataEntity);
    let data = await dataRepository.findOneBy({
      title: 'events_count',
    });
    if (!data) {
      this.logger.debug('Events count not found, initializing with 0');
      data = dataRepository.create({
        title: 'events_count',
        value: '0',
      });
      await dataRepository.save(data);
    }
    this.logger.debug(`Current events count: ${data.value}`);
    return {
      status: 'success',
      message: 'Event count fetched successfully.',
      timestamp: new Date(),
      data: data.value,
    };
  }

  /**
   * Gets the total count of crew members
   * @returns {Promise<ResultType<number>>} A result object containing the total crew count
   */
  async getCrewCount(): Promise<ResultType<number>> {
    this.logger.log('Fetching total crew count');
    const crewRepository = this.dataSource.getRepository(CrewEntity);
    const count = await crewRepository.count({});
    this.logger.debug(`Total crew count: ${count}`);
    return {
      status: 'success',
      message: 'User count fetched successfully.',
      timestamp: new Date(),
      data: count,
    };
  }

  /**
   * Retrieves various system information counts including users, bugs, events, and crew
   * @returns {Promise<{userCount: number, debugCount: number, eventCount: string, crewCount: number}>} Object containing various system counts
   */
  async getInfos() {
    this.logger.log('Fetching all system information counts');
    const userCount = (await this.userCount()).data;
    const debugCount = (await this.getSolvedBugCount()).data;
    const eventCount = (await this.EventsCount()).data;
    const crewCount = (await this.getCrewCount()).data;
    this.logger.debug(
      `Retrieved counts - Users: ${userCount}, Bugs: ${debugCount}, Events: ${eventCount}, Crew: ${crewCount}`,
    );
    return {
      userCount,
      debugCount,
      eventCount,
      crewCount,
    };
  }
}
