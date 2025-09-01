import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CommunityAdvertiseEntity } from 'src/common/entities/community/advertise.entity';
import { CommunityAlartEntity } from 'src/common/entities/community/alart.entity';
import { CommunityBadgeEntity } from 'src/common/entities/community/badge.entity';
import { CommunityCategoryEntity } from 'src/common/entities/community/category.entity';
import { CommunityPostEntity } from 'src/common/entities/community/post.entity';
import { CommunityUserEntity } from 'src/common/entities/community/user.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { DataSource, In, MoreThan } from 'typeorm';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);
  constructor(
    private readonly dataSource: DataSource,
    private readonly configService: ConfigService,
  ) {}

  /**
   * Get community user information including level and experience points
   * @param userId - The ID of the user to get community info for
   * @returns Object containing:
   *  - status: 'success'
   *  - message: Success message
   *  - data: {
   *    description: User's community profile description
   *    level: Current level calculated from exp
   *    nextLevelExp: Experience points needed for next level
   *    currentExp: Current experience points towards next level
   *  }
   *  - timestamp: Current date/time
   * @throws {BadRequestException} When user is not found
   */
  async getCommunityUserInfo(userId: number): Promise<
    ResultType<{
      description: string;
      level: number;
      nextLevelExp: number;
      currentExp: number;
      isBanned: boolean;
      banExpiresAt?: string;
      defaultBadge: CommunityBadgeEntity;
    }>
  > {
    const communityUserRepository =
      this.dataSource.getRepository(CommunityUserEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);
    const badgeRepository = this.dataSource.getRepository(CommunityBadgeEntity);

    const foundUser = await userRepository.findOneBy({ id: userId });
    if (!foundUser) throw new BadRequestException("Couldn't find user");
    let userInfo = await communityUserRepository.findOneBy({
      user: foundUser,
    });
    if (!userInfo) {
      userInfo = communityUserRepository.create({
        exp: 0,
        description: '',
        user: foundUser,
      });
      await communityUserRepository.save(userInfo);
    }

    let level = 0;
    let remainingExp = userInfo.exp;
    let requiredExp = 200;

    while (remainingExp >= requiredExp) {
      level++;
      remainingExp -= requiredExp;
      requiredExp += 100;
    }

    if (!userInfo.defaultBadge) {
      const defaultBadge = await badgeRepository.findOneBy({
        defaults: true,
      });
      if (defaultBadge) {
        userInfo.defaultBadge = defaultBadge;
        await communityUserRepository.save(userInfo);
      }
    }

    if (userInfo.isBanned) {
      if (userInfo.banExpireAt && userInfo.banExpireAt < new Date()) {
        userInfo.isBanned = false;
        userInfo.banExpireAt = undefined;
        await communityUserRepository.save(userInfo);
      }
    }

    const res: {
      description: string;
      level: number;
      nextLevelExp: number;
      currentExp: number;
      point: number;
      isBanned: boolean;
      banExpiresAt?: string;
      defaultBadge: CommunityBadgeEntity;
    } = {
      description: userInfo.description,
      level,
      nextLevelExp: requiredExp,
      currentExp: remainingExp,
      point: userInfo.point,
      isBanned: userInfo.isBanned,
      defaultBadge: userInfo.defaultBadge,
    };

    if (userInfo.isBanned && userInfo.banExpireAt) {
      const date = userInfo.banExpireAt;
      res.banExpiresAt = `${date.getFullYear()}년 ${`${date.getMonth() + 1}`.padStart(2, '0')}월 ${date.getDate()}일`;
    }

    return {
      status: 'success',
      message: 'Successfully retrieved community user info',
      data: res,
      timestamp: new Date(),
    };
  }
  /**
   * Retrieves hot posts from the last week and updates user experience points
   * @param take Number of posts to retrieve
   * @returns Hot posts with updated status
   */
  async hot(take: number) {
    const postRepository = this.dataSource.getRepository(CommunityPostEntity);
    const alartRepository = this.dataSource.getRepository(CommunityAlartEntity);
    const communityUserRepository =
      this.dataSource.getRepository(CommunityUserEntity);

    // Calculate date 7 days ago
    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    // Get posts from last week ordered by points
    const posts = await postRepository.find({
      where: {
        createdAt: MoreThan(oneWeekAgo),
        isDeleted: false,
      },
      order: {
        points: 'DESC',
      },
      relations: {
        writer: true,
      },
      take,
    });

    // Filter posts that have never been hot
    const newHotPosts = posts.filter((post) => !post.isHot);

    if (newHotPosts.length) {
      // Update these posts to be marked as hot
      await postRepository.update(
        newHotPosts.map((post) => post.id),
        { isHot: true },
      );

      // Get unique writers of new hot posts and update their exp
      const uniqueWriters = [
        ...new Set(newHotPosts.map((post) => post.writer.id)),
      ];
      await communityUserRepository.update(uniqueWriters, {
        exp: () => 'exp + 500',
        point: () => 'point + 1000',
      });

      const alerts = uniqueWriters.map((writerId) => {
        return alartRepository.create({
          content:
            '축하드립니다! 당신의 게시글이 핫 게시글로 선정되셨습니다. 500 경험치와 1000 코인이 지급됩니다.',
          target: { id: writerId } as CommunityUserEntity,
          createdAt: new Date(),
          writer: '디버거즈 웹 서비스',
          read: false,
        });
      });

      await alartRepository.save(alerts);
    }

    return {
      status: 'success',
      message: 'Successfully retrieved hot posts',
      data: posts,
      timestamp: new Date(),
    };
  }
  /**
   * Retrieves hot posts from the community
   * @param take - Number of posts to retrieve (default: 5)
   * @returns Promise containing an array of hot posts
   * @description
   * - Retrieves posts ordered by points in descending order
   * - Updates posts that have never been hot before
   * - Awards experience points and coins to writers of newly hot posts
   * - Sends alerts to writers whose posts became hot
   */

  async getAllRecentPosts(): Promise<
    ResultType<
      {
        category: CommunityCategoryEntity;
        posts: CommunityPostEntity[];
      }[]
    >
  > {
    const categoryRepository = this.dataSource.getRepository(
      CommunityCategoryEntity,
    );
    const postRepository = this.dataSource.getRepository(CommunityPostEntity);

    const categories = await categoryRepository.find();
    const result = await Promise.all(
      categories.map(async (category) => {
        const posts = await postRepository.find({
          where: { category: { id: category.id }, isDeleted: false },
          order: { createdAt: 'DESC' },
          take: 5,
          relations: ['category', 'writer', 'writer.user'],
        });
        return {
          category,
          posts,
        };
      }),
    );

    return {
      status: 'success',
      message: 'Successfully retrieved recent posts by category',
      data: result,
      timestamp: new Date(),
    };
  }
}
