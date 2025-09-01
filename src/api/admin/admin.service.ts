import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { AdminBannerDto } from 'src/common/dto/admin/banner.dto';
import { AdminDeleteNoticeDto } from 'src/common/dto/admin/delete-notice.dto';
import { AdminEditAboutDto } from 'src/common/dto/admin/edit-about.dto';
import { AdminNoticeDto } from 'src/common/dto/admin/notice.dto';
import { GlobalDataEntity } from 'src/common/entities/global/data.entity';
import { NoticeEntity } from 'src/common/entities/global/notice.entity';
import { BannerEntity } from 'src/common/entities/site-info/banner.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { CloudflareService } from 'src/providers/cloudflare/cloudflare.service';
import { DataSource } from 'typeorm';

/**
 * Service handling administrative operations
 */
@Injectable()
export class AdminService {
  private readonly logger = new Logger(AdminService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly cloudflareService: CloudflareService,
  ) {}

  /**
   * Creates or updates a notice
   * @param {AdminNoticeDto} noticeDto - The notice data transfer object containing title, contents and optional id and expiredAt
   * @param {number} userId - The ID of the user attempting to create/update the notice
   * @returns {Promise<ResultType<NoticeEntity>>} A promise containing the result with the created/updated notice data
   * @throws {ForbiddenException} When user doesn't have sufficient permissions (permission < 3)
   * @throws {ConflictException} When updating and notice with given ID is not found
   */
  async notice(
    noticeDto: AdminNoticeDto,
    userId: number,
  ): Promise<ResultType<NoticeEntity>> {
    this.logger.log(`Creating/updating notice by user ${userId}`);
    this.logger.debug('Notice DTO received:', JSON.stringify(noticeDto));

    const userRepository = this.dataSource.getRepository(UserEntity);
    const noticeRepository = this.dataSource.getRepository(NoticeEntity);

    const user = await userRepository.findOneBy({ id: userId });
    this.logger.debug('Found user details:', JSON.stringify(user));

    if (!user || user.permission < 3) {
      this.logger.warn(
        `Access denied for user ${userId} - insufficient permissions (Required: 3, Current: ${user?.permission})`,
      );
      throw new ForbiddenException('Access denied');
    }

    let data: NoticeEntity;
    if (noticeDto.id) {
      this.logger.log(`Updating existing notice with id ${noticeDto.id}`);
      const notice = await noticeRepository.findOneBy({ id: noticeDto.id });

      if (!notice) {
        this.logger.warn(
          `Notice with id ${noticeDto.id} not found in database`,
        );
        throw new ConflictException('Notice not found.');
      }

      this.logger.debug('Existing notice details:', JSON.stringify(notice));
      const param: NoticeEntity = {
        ...notice,
        title: noticeDto.title,
        contents: noticeDto.contents,
      };
      if (noticeDto.expiredAt) param.expiredAt = new Date(noticeDto.expiredAt);

      this.logger.debug(
        'Updating notice with parameters:',
        JSON.stringify(param),
      );
      await noticeRepository.update(noticeDto.id, param);

      data = {
        id: noticeDto.id,
        title: noticeDto.title,
        contents: noticeDto.contents,
        expiredAt: noticeDto.expiredAt
          ? new Date(noticeDto.expiredAt)
          : notice.expiredAt,
      };
      this.logger.debug('Updated notice data:', JSON.stringify(data));
    } else {
      this.logger.log('Creating new notice entry');
      const newNotice = noticeRepository.create({
        title: noticeDto.title,
        contents: noticeDto.contents,
        expiredAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // Default 7 days
      });
      if (noticeDto.expiredAt)
        newNotice.expiredAt = new Date(noticeDto.expiredAt);

      this.logger.debug('New notice to be created:', JSON.stringify(newNotice));
      await noticeRepository.save(newNotice);
      data = newNotice;
      this.logger.debug('Created notice details:', JSON.stringify(data));
    }

    this.logger.log(
      `Notice operation completed successfully for user ${userId}`,
    );
    return {
      status: 'success',
      message: 'Notice posted successfully',
      data,
      timestamp: new Date(),
    };
  }

  /**
   * Deletes a notice from the system
   * @param {AdminDeleteNoticeDto} deleteNoticeDto - The DTO containing the ID of notice to delete
   * @param {number} userId - The ID of the user attempting to delete the notice
   * @returns {Promise<ResultType<{ affected: number }>>} A promise containing the result with number of affected rows
   * @throws {ForbiddenException} When user doesn't have sufficient permissions (permission < 3)
   * @throws {ConflictException} When notice with given ID is not found or ID is invalid
   */
  async deleteNotice(
    deleteNoticeDto: AdminDeleteNoticeDto,
    userId: number,
  ): Promise<ResultType<{ affected: number }>> {
    this.logger.log(`Attempting to delete notice by user ${userId}`);
    this.logger.debug(
      'Delete notice request:',
      JSON.stringify(deleteNoticeDto),
    );

    let noticeId: number;
    try {
      noticeId = parseInt(deleteNoticeDto.id);
      this.logger.debug(`Successfully parsed notice ID: ${noticeId}`);
    } catch (e) {
      this.logger.error(
        `Failed to parse notice ID: ${deleteNoticeDto.id}`,
        e.stack,
      );
      throw new ConflictException('ID must be a valid number');
    }

    const userRepository = this.dataSource.getRepository(UserEntity);
    const noticeRepository = this.dataSource.getRepository(NoticeEntity);

    const user = await userRepository.findOneBy({ id: userId });
    this.logger.debug('User details:', JSON.stringify(user));

    if (!user || user.permission < 3) {
      this.logger.warn(
        `Access denied for user ${userId} - insufficient permissions (Required: 3, Current: ${user?.permission})`,
      );
      throw new ForbiddenException('Access denied');
    }

    const notice = await noticeRepository.findBy({ id: noticeId });
    this.logger.debug('Found notices:', JSON.stringify(notice));

    if (notice.length === 0) {
      this.logger.warn(`No notice found with id ${noticeId} in database`);
      throw new ConflictException("Couldn't find notice");
    }

    this.logger.debug(
      'Attempting to delete notices with IDs:',
      notice.map((n) => n.id),
    );
    const res = await noticeRepository.delete(
      notice.map((notice) => notice.id),
    );
    this.logger.debug('Delete operation result:', JSON.stringify(res));

    this.logger.log(
      `Successfully deleted ${res.affected} notice(s) by user ${userId}`,
    );
    return {
      status: 'success',
      message: 'Notice deleted successfully',
      data: {
        affected: res.affected || 0,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Updates the about page content
   * @param {AdminEditAboutDto} editDto - The DTO containing the new about page content
   * @param {number} userId - The ID of the user attempting to edit the about page
   * @returns {Promise<ResultType<{value: string}>>} A promise containing the result with updated content
   * @throws {ForbiddenException} When user doesn't have sufficient permissions (permission < 4)
   */
  async editAbout(
    editDto: AdminEditAboutDto,
    userId: number,
  ): Promise<ResultType<{ value: string }>> {
    this.logger.log(`Attempting to edit about page by user ${userId}`);
    this.logger.debug('Edit about request:', JSON.stringify(editDto));

    const dataRepository = this.dataSource.getRepository(GlobalDataEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    const user = await userRepository.findOneBy({ id: userId });
    this.logger.debug('User details:', JSON.stringify(user));

    if (!user || user.permission < 4) {
      this.logger.warn(
        `Access denied for user ${userId} - insufficient permissions (Required: 4, Current: ${user?.permission})`,
      );
      throw new ForbiddenException('Access denied');
    }

    let data = await dataRepository.findOneBy({
      title: 'ckdebuggers_about',
    });
    this.logger.debug('Current about page data:', JSON.stringify(data));

    if (!data) {
      this.logger.debug('About page data not found, creating new entry');
      data = dataRepository.create({
        title: 'ckdebuggers_about',
        value: editDto.contents,
      });
      await dataRepository.save(data);
      this.logger.debug('Created new about page data:', JSON.stringify(data));
    } else {
      this.logger.debug('Updating existing about page data');
      await dataRepository.update(data.id, {
        value: editDto.contents,
      });
      this.logger.debug('Updated about page content successfully');
    }

    this.logger.log(`About page successfully updated by user ${userId}`);
    return {
      status: 'success',
      message: 'About page updated successfully',
      data: {
        value: editDto.contents,
      },
      timestamp: new Date(),
    };
  }

  /**
   * Creates or updates a banner based on the provided DTO
   * @param bannerDto - The banner data transfer object containing banner information
   * @param userId - The ID of the user attempting to create/update the banner
   * @returns A promise containing the result with the created/updated banner entity
   * @throws ForbiddenException if user doesn't have sufficient permissions
   * @throws NotFoundException if updating a non-existent banner
   */
  async banner(
    bannerDto: AdminBannerDto,
    userId: number,
  ): Promise<ResultType<BannerEntity>> {
    this.logger.log(`Creating/updating banner by user ${userId}`);
    this.logger.debug('Banner DTO received:', JSON.stringify(bannerDto));

    const userRepository = this.dataSource.getRepository(UserEntity);
    const bannerRepository = this.dataSource.getRepository(BannerEntity);

    const user = await userRepository.findOneBy({ id: userId });
    this.logger.debug('Found user details:', JSON.stringify(user));

    if (!user || user.permission < 3) {
      this.logger.warn(
        `Access denied for user ${userId} - insufficient permissions (Required: 3, Current: ${user?.permission})`,
      );
      throw new ForbiddenException('Access denied');
    }

    let banner: BannerEntity;
    const image =
      bannerDto.thumbnail.startsWith('http') ||
      bannerDto.thumbnail.startsWith('/')
        ? bannerDto.thumbnail
        : await this.cloudflareService.getImageUrl(bannerDto.thumbnail);

    if (bannerDto.id) {
      this.logger.debug(
        `Attempting to update existing banner with ID: ${bannerDto.id}`,
      );
      const found = await bannerRepository.findOneBy({
        id: bannerDto.id,
      });
      if (!found) {
        this.logger.warn(`Banner with ID ${bannerDto.id} not found`);
        throw new NotFoundException('Banner item not found.');
      }
      this.logger.debug(
        'Updating banner with new data:',
        JSON.stringify(bannerDto),
      );
      await bannerRepository.update(found.id, {
        title: bannerDto.title,
        url: bannerDto.url,
        contents: bannerDto.contents,
        image,
      });
      banner = found;
      this.logger.debug('Banner updated successfully:', JSON.stringify(banner));
    } else {
      this.logger.debug(
        'Creating new banner with data:',
        JSON.stringify(bannerDto),
      );
      banner = bannerRepository.create({
        title: bannerDto.title,
        url: bannerDto.url,
        contents: bannerDto.contents,
        image,
        visible: true,
      });
      await bannerRepository.save(banner);
      this.logger.debug(
        'New banner created successfully:',
        JSON.stringify(banner),
      );
    }

    this.logger.log(
      `Banner ${bannerDto.id ? 'updated' : 'created'} successfully by user ${userId}`,
    );
    return {
      status: 'success',
      message: bannerDto.id
        ? 'Banner updated successfully'
        : 'Banner created successfully',
      data: banner,
      timestamp: new Date(),
    };
  }
}
