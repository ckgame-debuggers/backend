import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Cron, CronExpression } from '@nestjs/schedule';
import axios from 'axios';
import { SCHEDULER_CONFIG } from 'src/common/configs/scheduler.config';
import { GlobalImageRecordEntity } from 'src/common/entities/global/image-record.entity';
import { DataSource, LessThan } from 'typeorm';

@Injectable()
export class CloudflareService {
  private readonly logger = new Logger(CloudflareService.name);

  /**
   * Creates an instance of CloudflareService
   * @param {ConfigService} configService - NestJS config service for accessing environment variables
   * @param {DataSource} dataSource - TypeORM data source for database operations
   */
  constructor(
    private readonly configService: ConfigService,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Gets a direct upload URL from Cloudflare Images API
   * @returns {Promise<{id: string, uploadURL: string}>} Object containing upload ID and URL
   * @throws {Error} If the Cloudflare API request fails
   * @description Makes a POST request to Cloudflare's direct upload endpoint to get a one-time upload URL.
   * The URL can be used to upload an image directly to Cloudflare Images.
   * Requires CLOUDFLARE_ID and CLOUDFLARE_SECRET environment variables to be set.
   */
  async getUploadUrl(type?: string) {
    const recordRepository = this.dataSource.getRepository(
      GlobalImageRecordEntity,
    );

    const formData = new FormData();
    formData.append('requireSignedURLs', 'false');
    if (type) {
      formData.append('metadata', JSON.stringify({ type }));
    }

    const data = (
      await axios.post(
        `https://api.cloudflare.com/client/v4/accounts/${this.configService.get<string>(
          'CLOUDFLARE_ID',
        )}/images/v2/direct_upload`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>('CLOUDFLARE_SECRET')}`,
            'Content-Type': 'multipart/form-data',
          },
        },
      )
    ).data as {
      result: {
        id: string;
        uploadURL: string;
      };
      success: boolean;
      errors: string[];
      messages: string[];
    };

    if (!data.success) throw new Error(data.errors.join('\n'));

    const recordData = recordRepository.create({
      record_id: data.result.id,
      expires_in: new Date(Date.now() + 24 * 60 * 60 * 1000),
      uploaded: false,
    });

    recordRepository.save(recordData);

    return data.result;
  }

  /**
   * Checks if an image exists in Cloudflare Images
   * @param {string} id - The ID of the image to check
   * @returns {Promise<{id: string, metadata: Record<string, string>, uploaded: string, requireSignedURLs: boolean, variants: string[], draft: boolean}>} Image record details
   * @throws {Error} If the Cloudflare API request fails
   * @description Makes a GET request to Cloudflare's Images API to check if an image exists and get its details.
   * Requires CLOUDFLARE_ID and CLOUDFLARE_SECRET environment variables to be set.
   */
  async checkImageRecord(id: string) {
    try {
      const response = await axios.get(
        `https://api.cloudflare.com/client/v4/accounts/${this.configService.get<string>(
          'CLOUDFLARE_ID',
        )}/images/v1/${id}`,
        {
          headers: {
            Authorization: `Bearer ${this.configService.get<string>('CLOUDFLARE_SECRET')}`,
            'Content-Type': 'application/json',
          },
        },
      );

      const data = response.data as {
        result: {
          id: string;
          metadata: Record<string, string>;
          uploaded: string;
          requireSignedURLs: boolean;
          variants: string[];
          draft: boolean;
        };
        success: boolean;
        errors: string[];
        messages: string[];
      };

      if (!data.success) {
        throw new Error(
          `Cloudflare API error: ${data.errors?.join(', ') || 'Unknown error'}`,
        );
      }

      if (!data.result) {
        throw new Error('Image not found or invalid response from Cloudflare');
      }

      return data.result;
    } catch (error) {
      if (error.response?.status === 404) {
        throw new Error('Image not found');
      }
      if (error.response?.status === 401 || error.response?.status === 403) {
        throw new Error(
          'Authentication failed - check your Cloudflare credentials',
        );
      }
      throw new Error(`Failed to check image record: ${error.message}`);
    }
  }

  /**
   * Gets the URL of an uploaded image from Cloudflare Images
   * @param {string} id - The ID of the image to get the URL for
   * @returns {Promise<string>} The URL of the first variant of the image
   * @throws {BadRequestException} If the image record is not found or the image is not uploaded
   * @description Retrieves the URL for an uploaded image by checking the local record and Cloudflare status.
   * Deletes the local record after successful retrieval.
   */
  async getImageUrl(id: string) {
    const recordRepository = this.dataSource.getRepository(
      GlobalImageRecordEntity,
    );
    const res = await recordRepository.findOneBy({
      record_id: id,
    });
    if (!res) throw new BadRequestException("Couldn't find requested image.");
    const data = await this.checkImageRecord(id);
    if (!data.uploaded)
      throw new BadRequestException("Couldn't find requested image.");
    await recordRepository.delete(res);
    return data.variants[0];
  }

  /**
   * Updates the upload status of an image record
   * @param {string} id - The ID of the image record to update
   * @returns {Promise<{url:string}>} URL if upload status was updated successfully, false otherwise
   * @throws {Error} If image record is not found
   */
  async setUploaded(id: string) {
    const recordRepository = this.dataSource.getRepository(
      GlobalImageRecordEntity,
    );

    try {
      const imageData = await this.checkImageRecord(id);
      if (imageData.uploaded) {
        const record = await recordRepository.findOne({
          where: { record_id: id },
        });

        if (!record) {
          throw new Error('Image record not found');
        }
        record.uploaded = true;
        await recordRepository.save(record);
        return {
          url: imageData.variants[0],
        };
      }
      return false;
    } catch (error) {
      this.logger.error(
        `Failed to check image upload status: ${error.message}`,
      );
      throw new ConflictException("Couldn't check upload info.");
    }
  }

  /**
   * Deletes an image from Cloudflare Images
   * @param {string} id - The ID of the image to delete
   * @returns {Promise<{success: boolean}>} Response indicating if deletion was successful
   * @throws {Error} If the Cloudflare API request fails
   * @description Makes a DELETE request to Cloudflare's Images API to remove an image.
   * Requires CLOUDFLARE_ID and CLOUDFLARE_SECRET environment variables to be set.
   */
  async deleteImage(id: string) {
    const data = (await axios.delete(
      `https://api.cloudflare.com/client/v4/accounts/${this.configService.get<string>(
        'CLOUDFLARE_ID',
      )}/images/v1/${id}`,
      {
        headers: {
          Authorization: `Bearer ${this.configService.get<string>('CLOUDFLARE_SECRET')}`,
          'Content-Type': 'application/json',
        },
      },
    )) as {
      success: boolean;
    };

    return data;
  }

  /**
   * Scheduled task to clean up expired image records
   * @description Runs daily at 10 AM to remove expired image records and their corresponding images from Cloudflare.
   * Processes records in batches to avoid memory issues with large datasets.
   */
  @Cron(CronExpression.EVERY_DAY_AT_10AM)
  async cleanUpExpiredImage() {
    const now = new Date();
    const recordRepository = this.dataSource.getRepository(
      GlobalImageRecordEntity,
    );
    const expired = await recordRepository.count({
      where: {
        expires_in: LessThan(now),
      },
    });

    if (expired === 0) {
      this.logger.debug('No expired OAuth2 refresh tokens found to clean up');
      return;
    }

    const batchSize = SCHEDULER_CONFIG.BATCH_SIZE;
    let totalDeleted = 0;
    let hasMore = true;
    while (hasMore) {
      const expiredRecords = await recordRepository
        .createQueryBuilder('global-image-records')
        .select('global-image-records.id')
        .where('global-image-records.expires_in < :now', { now })
        .limit(batchSize)
        .getMany();

      if (expiredRecords.length === 0) {
        hasMore = false;
        break;
      }
      const ids: number[] = [];
      for (const record of expiredRecords) {
        if (record.uploaded) {
          await this.deleteImage(record.record_id);
        }
        ids.push(record.id);
      }
      const result = await recordRepository.delete(ids);
      totalDeleted += result.affected || 0;

      if (expiredRecords.length < batchSize) {
        hasMore = false;
      }

      if (hasMore) {
        await new Promise((resolve) => setTimeout(resolve, 100));
      }
    }

    if (totalDeleted > 0) {
      this.logger.log(
        `Cleaned up ${totalDeleted} expired records at ${now.toISOString()}`,
      );
    }
  }
}
