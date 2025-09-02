import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { CommunityNewPostDto } from 'src/common/dto/community/post/new-post.dto';
import { CommunityUpdatePostDto } from 'src/common/dto/community/post/update-post.dto';
import { CommunityCategoryEntity } from 'src/common/entities/community/category.entity';
import { CommunityPostEntity } from 'src/common/entities/community/post.entity';
import { CommunityUserEntity } from 'src/common/entities/community/user.entity';
import { CommunityPostReactionEntity } from 'src/common/entities/community/reaction.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { CloudflareService } from 'src/providers/cloudflare/cloudflare.service';
import { DataSource } from 'typeorm';
import { CommunityReactionType } from '../../../types/community-reaction';

@Injectable()
export class PostService {
  private readonly logger = new Logger(PostService.name);

  constructor(
    private readonly dataSource: DataSource,
    private readonly cloudflareService: CloudflareService,
  ) {}

  /**
   * Constructor for PostService
   * @param dataSource - TypeORM DataSource for database operations
   * @param cloudflareService - Service for Cloudflare related operations
   */
  async getAll() {
    this.logger.debug('Getting all posts by category');
    const categoryRepository = this.dataSource.getRepository(
      CommunityCategoryEntity,
    );
    const postRepository = this.dataSource.getRepository(CommunityPostEntity);

    const categories = await categoryRepository.find();
    this.logger.debug(`Found ${categories.length} categories`);

    const result = await Promise.all(
      categories.map(async (category) => {
        const posts = await postRepository.find({
          where: { category: { id: category.id }, isDeleted: false },
          order: { createdAt: 'DESC' },
          take: 5,
          relations: ['category', 'writer', 'writer.user', 'badge'],
        });
        this.logger.debug(
          `Found ${posts.length} posts for category ${category.id}`,
        );
        return {
          category,
          posts,
        };
      }),
    );

    return {
      status: 'success',
      message: 'Successfully retrieved posts by category',
      data: result,
      timestamp: new Date(),
    };
  }

  /**
   * Retrieves a community post by its ID
   * @param id - The ID of the post to retrieve
   * @returns Promise containing the found post entity
   * @throws NotFoundException if the post with given ID is not found
   */
  async getPost(
    id: number,
    requestUserId?: number,
  ): Promise<
    ResultType<{
      post: CommunityPostEntity;
      reactions: {
        likes: number;
        dislikes: number;
        myType: CommunityReactionType;
      };
    }>
  > {
    this.logger.debug(
      `Getting post with id ${id}, requested by user ${requestUserId}`,
    );
    const userRepository = this.dataSource.getRepository(UserEntity);
    const communityUserRepository =
      this.dataSource.getRepository(CommunityUserEntity);
    const postRepository = this.dataSource.getRepository(CommunityPostEntity);
    const found = await postRepository.findOne({
      where: { id, isDeleted: false },
      relations: ['category', 'writer', 'writer.user', 'badge'],
      select: {
        id: true,
        title: true,
        content: true,
        createdAt: true,
        isUnknown: true,
        isHot: true,
        thumbnail: true,
        permission: true,
        points: true,
        category: true,
        badge: {
          id: true,
          title: true,
          img: true,
          description: true,
          isDefault: true,
        },
        writer: {
          id: true,
          user: {
            username: true,
            profile: true,
            color: true,
          },
        },
      },
    });
    if (!found) {
      this.logger.warn(`Post with id ${id} not found`);
      throw new NotFoundException('Post not found.');
    }
    let permission = 0;
    let userId = 0;
    if (requestUserId) {
      const user = await userRepository.findOneBy({ id: requestUserId });
      if (user) {
        this.logger.debug(
          `Found requesting user: ${user.id} with permission ${user.permission}`,
        );
        if (user.permission > 2) {
          permission = user.permission;
        }
        const communityUser = await communityUserRepository.findOneBy({ user });
        if (communityUser) {
          userId = communityUser.id;
          this.logger.debug(`Found community user: ${communityUser.id}`);
        }
      }
    }
    const isAuthorizedViewer = permission > 2 || userId === found.writer.id;
    this.logger.debug(`User is authorized viewer: ${isAuthorizedViewer}`);

    if (found.isUnknown) {
      this.logger.debug('Processing anonymous post view');
      found.writer.id = isAuthorizedViewer ? found.writer.id : 0;
      found.writer.user.username = isAuthorizedViewer
        ? `${found.writer.user.username} (익명 처리됨)`
        : '익명';
      if (!isAuthorizedViewer) {
        found.writer.user.profile = '가려짐';
        found.writer.user.color = 'undefined';
      }
    }

    // reaction counts and my reaction
    const reactionRepository = this.dataSource.getRepository(
      CommunityPostReactionEntity,
    );
    const [likesCount, dislikesCount] = await Promise.all([
      reactionRepository.count({ where: { post: { id }, value: 1 } }),
      reactionRepository.count({ where: { post: { id }, value: -1 } }),
    ]);
    let myReaction = 0;
    if (userId > 0) {
      const mine = await reactionRepository.findOne({
        where: { post: { id: found.id }, user: { id: userId } },
      });
      if (mine) myReaction = mine.value;
    }
    const myType: CommunityReactionType =
      myReaction === 1
        ? CommunityReactionType.Like
        : myReaction === -1
          ? CommunityReactionType.Dislike
          : CommunityReactionType.None;

    return {
      status: 'success',
      message: 'Successfully retrieved post',
      data: {
        post: found,
        reactions: {
          likes: likesCount,
          dislikes: dislikesCount,
          myType,
        },
      },
      timestamp: new Date(),
    };
  }

  /**
   * Creates a new community post
   * @param newPostDto - DTO containing the new post data (title, content, category, isUnknown)
   * @param userId - ID of the user creating the post
   * @returns Promise containing the result with the created post data
   * @throws ConflictException if user or category is not found
   */
  async newPost(
    newPostDto: CommunityNewPostDto,
    userId: number,
  ): Promise<ResultType<CommunityPostEntity>> {
    this.logger.debug(`Creating new post for user ${userId}`);
    const postRepository = this.dataSource.getRepository(CommunityPostEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);
    const communityUserRepository =
      this.dataSource.getRepository(CommunityUserEntity);
    const categoryRepository = this.dataSource.getRepository(
      CommunityCategoryEntity,
    );

    // Find user and their community profile
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) {
      this.logger.warn(`User ${userId} not found`);
      throw new ConflictException("Couldn't find user");
    }
    const communityUser = await communityUserRepository.findOne({
      where: { user: { id: userId } },
      relations: ['defaultBadge'],
    });
    if (!communityUser) {
      this.logger.warn(`Community user for user ${userId} not found`);
      throw new ConflictException("Couldn't find user community entity");
    }

    // Find selected category
    const category = await categoryRepository.findOneBy({
      id: newPostDto.category,
    });
    if (!category) {
      this.logger.warn(`Category ${newPostDto.category} not found`);
      throw new ConflictException("Couldn't find category");
    }

    this.logger.debug('Creating post entity');
    const post = postRepository.create({
      title: newPostDto.title,
      content: newPostDto.content,
      isUnknown: newPostDto.isUnknown,
      badge: communityUser.defaultBadge,
      writer: communityUser,
      createdAt: new Date(),
      isHot: false,
      thumbnail: '',
      permission: 0,
      points: 0,
      category,
    });

    if (newPostDto.thumbnail) {
      this.logger.debug('Setting thumbnail for post');
      post.thumbnail = newPostDto.thumbnail;
    }

    await postRepository.save(post);
    this.logger.debug(`Successfully created post with id ${post.id}`);
    return {
      status: 'success',
      message: 'Successfully created new post',
      data: post,
      timestamp: new Date(),
    };
  }

  /**
   * Updates an existing community post
   * @param postId - ID of the post to update
   * @param updatePostDto - DTO containing the updated post data
   * @param userId - ID of the user updating the post
   * @returns Promise containing the result with the updated post data
   * @throws NotFoundException if post is not found
   * @throws ConflictException if user doesn't have permission or category is not found
   */
  async updatePost(
    postId: number,
    updatePostDto: CommunityUpdatePostDto,
    userId: number,
  ): Promise<ResultType<CommunityPostEntity>> {
    this.logger.debug(`Updating post ${postId} by user ${userId}`);
    const postRepository = this.dataSource.getRepository(CommunityPostEntity);
    const categoryRepository = this.dataSource.getRepository(
      CommunityCategoryEntity,
    );

    // Find the existing post
    const post = await postRepository.findOne({
      where: { id: postId },
      relations: ['writer', 'writer.user', 'category'],
    });

    if (!post) {
      this.logger.warn(`Post ${postId} not found`);
      throw new NotFoundException('Post not found');
    }

    // Check if the user is the owner of the post
    if (post.writer.user.id !== userId) {
      this.logger.warn(
        `User ${userId} attempted to update post ${postId} without permission`,
      );
      throw new ForbiddenException('자신의 게시글만 수정할 수 있습니다.');
    }

    // Check if the post is deleted
    if (post.isDeleted) {
      this.logger.warn(`Attempted to update deleted post ${postId}`);
      throw new ConflictException('삭제된 게시글은 수정할 수 없습니다.');
    }

    this.logger.debug('Updating post fields');
    // Update fields if provided
    if (updatePostDto.title !== undefined) {
      post.title = updatePostDto.title;
    }

    if (updatePostDto.content !== undefined) {
      post.content = updatePostDto.content;
    }

    if (updatePostDto.isUnknown !== undefined) {
      post.isUnknown = updatePostDto.isUnknown;
    }

    if (updatePostDto.thumbnail !== undefined) {
      post.thumbnail = updatePostDto.thumbnail;
    }

    // Update category if provided
    if (updatePostDto.category !== undefined) {
      this.logger.debug(`Updating post category to ${updatePostDto.category}`);
      const category = await categoryRepository.findOneBy({
        id: updatePostDto.category,
      });
      if (!category) {
        this.logger.warn(`Category ${updatePostDto.category} not found`);
        throw new ConflictException("Couldn't find category");
      }
      post.category = category;
    }

    // Save the updated post
    await postRepository.save(post);
    this.logger.debug(`Successfully updated post ${postId}`);

    return {
      status: 'success',
      message: 'Successfully updated post',
      data: post,
      timestamp: new Date(),
    };
  }

  /**
   * Deletes an existing community post (soft delete)
   * @param postId - ID of the post to delete
   * @param userId - ID of the user deleting the post
   * @returns Promise containing the result of the deletion
   * @throws NotFoundException if post is not found
   * @throws ForbiddenException if user doesn't have permission
   */
  async deletePost(postId: number, userId: number): Promise<ResultType<null>> {
    this.logger.debug(`Deleting post ${postId} by user ${userId}`);
    const postRepository = this.dataSource.getRepository(CommunityPostEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    const reqUser = await userRepository.findOneBy({ id: userId });
    if (!reqUser) {
      this.logger.warn(`User ${userId} not found`);
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // Find the existing post
    const post = await postRepository.findOne({
      where: { id: postId },
      relations: ['writer', 'writer.user', 'comments'],
    });

    if (!post) {
      this.logger.warn(`Post ${postId} not found`);
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.isDeleted) {
      this.logger.warn(`Attempted to delete already deleted post ${postId}`);
      throw new ConflictException('이미 삭제된 게시글입니다.');
    }

    // Check if the user is the owner of the post or has admin permission
    const isOwner = post.writer.user.id === userId;
    const isAdmin = reqUser.permission >= 3; // Admin level 3 or higher
    this.logger.debug(
      `Delete request - isOwner: ${isOwner}, isAdmin: ${isAdmin}`,
    );

    if (!isOwner && !isAdmin) {
      this.logger.warn(
        `User ${userId} attempted to delete post ${postId} without permission`,
      );
      throw new ForbiddenException('자신의 게시글만 삭제할 수 있습니다.');
    }

    // Soft delete the post
    post.isDeleted = true;
    post.deletedAt = new Date();
    await postRepository.save(post);
    this.logger.debug(`Successfully deleted post ${postId}`);

    return {
      status: 'success',
      message: '게시글이 성공적으로 삭제되었습니다.',
      data: null,
      timestamp: new Date(),
    };
  }

  async likePost(
    postId: number,
    userId: number,
  ): Promise<ResultType<CommunityPostEntity>> {
    const postRepository = this.dataSource.getRepository(CommunityPostEntity);
    const reactionRepository = this.dataSource.getRepository(
      CommunityPostReactionEntity,
    );
    const communityUserRepository =
      this.dataSource.getRepository(CommunityUserEntity);

    const post = await postRepository.findOneBy({ id: postId });
    if (!post || post.isDeleted) {
      throw new NotFoundException('Post not found');
    }

    const communityUser = await communityUserRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!communityUser) {
      throw new NotFoundException('User not found');
    }

    let reaction = await reactionRepository.findOne({
      where: { post: { id: postId }, user: { id: communityUser.id } },
      relations: ['post', 'user'],
    });
    if (!reaction) {
      reaction = reactionRepository.create({
        post,
        user: communityUser,
        value: 1,
        createdAt: new Date(),
      });
      post.points += 1;
    } else {
      if (reaction.value === 1) {
        return {
          status: 'success',
          message: 'Already liked',
          data: post,
          timestamp: new Date(),
        };
      }
      if (reaction.value === -1) {
        // switch from dislike to like: +2
        reaction.value = 1;
        reaction.updatedAt = new Date();
        post.points += 2;
      }
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(CommunityPostReactionEntity).save(reaction);
      await manager.getRepository(CommunityPostEntity).save(post);
    });

    return {
      status: 'success',
      message: 'Liked the post',
      data: post,
      timestamp: new Date(),
    };
  }

  async dislikePost(
    postId: number,
    userId: number,
  ): Promise<ResultType<CommunityPostEntity>> {
    const postRepository = this.dataSource.getRepository(CommunityPostEntity);
    const reactionRepository = this.dataSource.getRepository(
      CommunityPostReactionEntity,
    );
    const communityUserRepository =
      this.dataSource.getRepository(CommunityUserEntity);

    const post = await postRepository.findOneBy({ id: postId });
    if (!post || post.isDeleted) {
      throw new NotFoundException('Post not found');
    }

    const communityUser = await communityUserRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!communityUser) {
      throw new NotFoundException('User not found');
    }

    let reaction = await reactionRepository.findOne({
      where: { post: { id: postId }, user: { id: communityUser.id } },
      relations: ['post', 'user'],
    });
    if (!reaction) {
      reaction = reactionRepository.create({
        post,
        user: communityUser,
        value: -1,
        createdAt: new Date(),
      });
      post.points -= 1;
    } else {
      if (reaction.value === -1) {
        return {
          status: 'success',
          message: 'Already disliked',
          data: post,
          timestamp: new Date(),
        };
      }
      if (reaction.value === 1) {
        // switch from like to dislike: -2
        reaction.value = -1;
        reaction.updatedAt = new Date();
        post.points -= 2;
      }
    }

    await this.dataSource.transaction(async (manager) => {
      await manager.getRepository(CommunityPostReactionEntity).save(reaction);
      await manager.getRepository(CommunityPostEntity).save(post);
    });

    return {
      status: 'success',
      message: 'Disliked the post',
      data: post,
      timestamp: new Date(),
    };
  }
}
