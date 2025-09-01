import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { DataSource, IsNull } from 'typeorm';
import { CommunityCommentEntity } from 'src/common/entities/community/comment.entity';
import { CommunityPostEntity } from 'src/common/entities/community/post.entity';
import { CommunityUserEntity } from 'src/common/entities/community/user.entity';
import { CreateCommentDto } from 'src/common/dto/community/comment/create-comment.dto';
import { UpdateCommentDto } from 'src/common/dto/community/comment/update-comment.dto';
import { CommentResponseDto } from 'src/common/dto/community/comment/comment-response.dto';
import { CommentListDto } from 'src/common/dto/community/comment/comment-list.dto';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { CommunityAlartEntity } from 'src/common/entities/community/alart.entity';

@Injectable()
export class CommentService {
  private readonly logger = new Logger(CommentService.name);

  constructor(private readonly dataSource: DataSource) {}

  /**
   * Create a comment
   * @param postId Post ID
   * @param userId User ID
   * @param createCommentDto Comment creation DTO
   * @returns Created comment information
   */
  async createComment(
    postId: number,
    userId: number,
    createCommentDto: CreateCommentDto,
  ): Promise<ResultType<CommentResponseDto>> {
    this.logger.log(`Creating comment for post ${postId} by user ${userId}`);

    const commentRepository = this.dataSource.getRepository(
      CommunityCommentEntity,
    );
    const postRepository = this.dataSource.getRepository(CommunityPostEntity);
    const communityUserRepository =
      this.dataSource.getRepository(CommunityUserEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    // Check if post exists
    const post = await postRepository.findOne({
      where: { id: postId, isDeleted: false },
    });
    if (!post) {
      this.logger.warn(`Post ${postId} not found`);
      throw new NotFoundException('Post not found');
    }

    // Check if user exists
    const userAcc = await userRepository.findOne({
      where: { id: userId },
    });

    if (!userAcc) {
      this.logger.warn(`User ${userId} not found`);
      throw new NotFoundException('User not found');
    }

    const user = await communityUserRepository.findOne({
      where: { user: userAcc },
      relations: ['user', 'defaultBadge'],
    });
    if (!user) {
      this.logger.warn(`User ${userId}'s community info not found`);
      throw new NotFoundException('User not found');
    }

    // Check if user is banned
    if (user.isBanned) {
      this.logger.warn(`Banned user ${userId} attempted to write comment`);
      throw new ForbiddenException('Banned users cannot write comments');
    }

    let parentComment: CommunityCommentEntity | null = null;
    if (createCommentDto.parentId) {
      this.logger.debug(`Checking parent comment ${createCommentDto.parentId}`);
      parentComment = await commentRepository.findOne({
        where: { id: createCommentDto.parentId },
        relations: ['post', 'writer', 'writer.user'],
      });
      if (!parentComment) {
        this.logger.warn(
          `Parent comment ${createCommentDto.parentId} not found`,
        );
        throw new NotFoundException('Parent comment not found');
      }
      if (parentComment.post.id != postId) {
        this.logger.warn(`Invalid parent comment - belongs to different post`);
        throw new BadRequestException(
          `Cannot reply to comments from different posts. Your post id : ${postId}, Parent's post id : ${parentComment.post.id}`,
        );
      }
    }

    // Create comment
    const comment = commentRepository.create({
      content: createCommentDto.content,
      post,
      writer: user,
      parent: parentComment || undefined,
      isUnknown: createCommentDto.isUnknown ?? false,
      createdAt: new Date(),
    });

    await commentRepository.save(comment);
    this.logger.log(`Created comment ${comment.id}`);

    // Grant experience and points
    await communityUserRepository.update(user.id, {
      exp: () => 'exp + 10',
      point: () => 'point + 5',
    });
    this.logger.debug(`Granted exp and points to user ${userId}`);

    // Create alerts for mentions like @[123456789]
    try {
      const alartRepository =
        this.dataSource.getRepository(CommunityAlartEntity);
      const mentionRegex = /@\[(\d{9})\]/g;
      const uniqueSchoolNumbers = new Set<string>();
      let match: RegExpExecArray | null;
      while ((match = mentionRegex.exec(createCommentDto.content)) !== null) {
        uniqueSchoolNumbers.add(match[1]);
      }

      if (uniqueSchoolNumbers.size > 0) {
        const userRepository = this.dataSource.getRepository(UserEntity);
        const communityUserRepository =
          this.dataSource.getRepository(CommunityUserEntity);

        const alerts: CommunityAlartEntity[] = [];
        for (const schoolNumber of uniqueSchoolNumbers) {
          const targetUser = await userRepository.findOne({
            where: { schoolNumber },
          });
          if (!targetUser) continue;
          const targetCommunity = await communityUserRepository.findOne({
            where: { user: { id: targetUser.id } },
          });
          if (!targetCommunity) continue;
          if (targetCommunity.id === user.id) continue; // skip self-mentions

          const writerName = comment.isUnknown
            ? '익명'
            : user.user?.username || '알 수 없음';
          const alert = alartRepository.create({
            content: `${writerName}님이 당신을 언급하셨습니다.`,
            target: targetCommunity,
            createdAt: new Date(),
            writer: writerName,
            read: false,
          });
          alerts.push(alert);
        }

        if (alerts.length) {
          await alartRepository.save(alerts);
        }
      }
    } catch (e) {
      this.logger.error('Failed to create mention alerts', e as any);
    }

    // Prepare response data
    const responseData: CommentResponseDto = {
      id: comment.id,
      content: comment.content,
      isDeleted: comment.isDeleted,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      likes: comment.likes,
      dislikes: comment.dislikes,
      isUnknown: comment.isUnknown,
      writer: {
        id: user.id,
        schoolNumber: user.user.schoolNumber,
        user: {
          nickname: comment.isUnknown
            ? '익명'
            : user.user?.fullname || 'Unknown',
          profileImage: comment.isUnknown
            ? '/resources/profile/unknown.png'
            : user.user?.profile,
          color: comment.isUnknown ? undefined : user.user?.color,
        },
        defaultBadge: comment.isUnknown
          ? undefined
          : user.defaultBadge
            ? {
                id: user.defaultBadge.id,
                name: user.defaultBadge.title,
                image: user.defaultBadge.img,
              }
            : undefined,
      },
      parent: parentComment
        ? {
            id: parentComment.id,
            writer: {
              user: {
                nickname: parentComment.isDeleted
                  ? 'Deleted user'
                  : parentComment.isUnknown
                    ? '익명'
                    : parentComment.writer?.user?.fullname || 'Unknown',
                color: parentComment.isDeleted
                  ? undefined
                  : parentComment.isUnknown
                    ? undefined
                    : parentComment.writer?.user?.color,
              },
            },
          }
        : undefined,
      replies: [],
      replyCount: 0,
    };

    return {
      status: 'success',
      message: 'Comment created successfully',
      data: responseData,
      timestamp: new Date(),
    };
  }

  /**
   * Get comments for a post
   * @param postId Post ID
   * @param query Pagination query
   * @returns List of comments
   */
  async getComments(
    postId: number,
    query: CommentListDto,
  ): Promise<
    ResultType<{ comments: CommentResponseDto[]; totalCount: number }>
  > {
    this.logger.log(`Getting comments for post ${postId}`);

    const commentRepository = this.dataSource.getRepository(
      CommunityCommentEntity,
    );
    const postRepository = this.dataSource.getRepository(CommunityPostEntity);

    // Check if post exists
    const post = await postRepository.findOne({
      where: { id: postId, isDeleted: false },
    });
    if (!post) {
      this.logger.warn(`Post ${postId} not found`);
      throw new NotFoundException('Post not found');
    }

    const { page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    this.logger.debug(`Fetching comments with page=${page}, limit=${limit}`);

    // Count only parent comments for pagination
    const totalCount = await commentRepository.count({
      where: { post: { id: postId }, parent: IsNull() },
    });

    // Paged parent comments
    const parentComments = await commentRepository.find({
      where: { post: { id: postId }, parent: IsNull() },
      relations: ['writer', 'writer.user', 'writer.defaultBadge'],
      order: { createdAt: 'ASC' },
      skip,
      take: limit,
    });

    // Load all comments for this post to build nested replies
    const allComments = await commentRepository.find({
      where: { post: { id: postId } },
      relations: [
        'writer',
        'writer.user',
        'writer.defaultBadge',
        'parent',
        'parent.writer',
        'parent.writer.user',
      ],
      order: { createdAt: 'ASC' },
    });

    const childrenMap = new Map<number, CommunityCommentEntity[]>();
    for (const c of allComments) {
      if (!c.parent) continue;
      if (c.isDeleted) continue;
      const list = childrenMap.get(c.parent.id) || [];
      list.push(c);
      childrenMap.set(c.parent.id, list);
    }

    const mapComment = (
      entity: CommunityCommentEntity,
      isTopLevel: boolean,
    ): CommentResponseDto => {
      const isDeleted = entity.isDeleted;
      const isUnknown = entity.isUnknown;
      const nickname = isDeleted
        ? 'Deleted user'
        : isUnknown
          ? '익명'
          : entity.writer.user.username;
      const profileImage = isDeleted
        ? undefined
        : isUnknown
          ? undefined
          : entity.writer.user.profile;
      const color = isDeleted
        ? undefined
        : isUnknown
          ? undefined
          : entity.writer.user.color;
      const defaultBadge =
        isDeleted || isUnknown || !entity.writer.defaultBadge
          ? undefined
          : {
              id: entity.writer.defaultBadge.id,
              name: entity.writer.defaultBadge.title,
              image: entity.writer.defaultBadge.img,
            };

      const parentInfo = entity.parent
        ? {
            id: entity.parent.id,
            writer: {
              user: {
                nickname: entity.parent.isDeleted
                  ? 'Deleted user'
                  : entity.parent.isUnknown
                    ? '익명'
                    : entity.parent.writer.user.username,
                color:
                  entity.parent.isDeleted || entity.parent.isUnknown
                    ? undefined
                    : entity.parent.writer.user.color,
              },
            },
          }
        : undefined;

      const repliesEntities = childrenMap.get(entity.id) || [];
      const repliesDtos = repliesEntities.map((child) =>
        mapComment(child, false),
      );

      return {
        id: entity.id,
        content: isDeleted ? 'Deleted comment' : entity.content,
        isDeleted: entity.isDeleted,
        createdAt: entity.createdAt,
        updatedAt: entity.updatedAt,
        likes: entity.likes,
        dislikes: entity.dislikes,
        isUnknown: entity.isUnknown,
        writer: {
          id: entity.writer.id,
          schoolNumber: entity.writer.user.schoolNumber,
          user: {
            nickname,
            profileImage,
            color,
          },
          defaultBadge,
        },
        parent: parentInfo,
        replies: repliesDtos,
        replyCount: repliesDtos.length,
      };
    };

    const comments: CommentResponseDto[] = parentComments.map((pc) =>
      mapComment(pc, true),
    );

    return {
      status: 'success',
      message: 'Comments retrieved successfully',
      data: { comments, totalCount },
      timestamp: new Date(),
    };
  }

  /**
   * Update a comment
   * @param commentId Comment ID
   * @param userId User ID
   * @param updateCommentDto Comment update DTO
   * @returns Updated comment information
   */
  async updateComment(
    commentId: number,
    userId: number,
    updateCommentDto: UpdateCommentDto,
  ): Promise<ResultType<CommentResponseDto>> {
    this.logger.log(`Updating comment ${commentId} by user ${userId}`);

    const commentRepository = this.dataSource.getRepository(
      CommunityCommentEntity,
    );

    const comment = await commentRepository.findOne({
      where: { id: commentId },
      relations: [
        'writer',
        'writer.user',
        'writer.defaultBadge',
        'parent',
        'parent.writer',
        'parent.writer.user',
      ],
    });

    if (!comment) {
      this.logger.warn(`Comment ${commentId} not found`);
      throw new NotFoundException('Comment not found');
    }

    if (comment.writer.id !== userId) {
      this.logger.warn(
        `User ${userId} attempted to edit comment ${commentId} owned by user ${comment.writer.id}`,
      );
      throw new ForbiddenException('You can only edit your own comments');
    }

    if (comment.isDeleted) {
      this.logger.warn(`Attempted to edit deleted comment ${commentId}`);
      throw new BadRequestException('Cannot edit deleted comments');
    }

    // Update comment
    comment.content = updateCommentDto.content;
    comment.updatedAt = new Date();

    await commentRepository.save(comment);
    this.logger.log(`Updated comment ${commentId}`);

    // Prepare response data
    const responseData: CommentResponseDto = {
      id: comment.id,
      content: comment.content,
      isDeleted: comment.isDeleted,
      createdAt: comment.createdAt,
      updatedAt: comment.updatedAt,
      likes: comment.likes,
      dislikes: comment.dislikes,
      isUnknown: comment.isUnknown,
      writer: {
        id: comment.writer.id,
        schoolNumber: comment.writer.user.schoolNumber,
        user: {
          nickname: comment.isUnknown ? '익명' : comment.writer.user.username,
          profileImage: comment.isUnknown
            ? undefined
            : comment.writer.user.profile,
          color: comment.isUnknown ? undefined : comment.writer.user.color,
        },
        defaultBadge:
          comment.isUnknown || !comment.writer.defaultBadge
            ? undefined
            : {
                id: comment.writer.defaultBadge.id,
                name: comment.writer.defaultBadge.title,
                image: comment.writer.defaultBadge.img,
              },
      },
      parent: comment.parent
        ? {
            id: comment.parent.id,
            writer: {
              user: {
                nickname: comment.parent.isDeleted
                  ? 'Deleted user'
                  : comment.parent.isUnknown
                    ? '익명'
                    : comment.parent.writer.user.username,
                color: comment.parent.isDeleted
                  ? undefined
                  : comment.parent.isUnknown
                    ? undefined
                    : comment.parent.writer.user.color,
              },
            },
          }
        : undefined,
      replies: [],
      replyCount: 0,
    };

    return {
      status: 'success',
      message: 'Comment updated successfully',
      data: responseData,
      timestamp: new Date(),
    };
  }

  /**
   * Delete a comment (soft delete)
   * @param commentId Comment ID
   * @param userId User ID
   * @returns Delete result
   */
  async deleteComment(
    commentId: number,
    userId: number,
  ): Promise<ResultType<null>> {
    this.logger.log(`Deleting comment ${commentId} by user ${userId}`);

    const commentRepository = this.dataSource.getRepository(
      CommunityCommentEntity,
    );

    const comment = await commentRepository.findOne({
      where: { id: commentId },
      relations: ['writer', 'replies'],
    });

    if (!comment) {
      this.logger.warn(`Comment ${commentId} not found`);
      throw new NotFoundException('Comment not found');
    }

    if (comment.writer.id !== userId) {
      this.logger.warn(
        `User ${userId} attempted to delete comment ${commentId} owned by user ${comment.writer.id}`,
      );
      throw new ForbiddenException('You can only delete your own comments');
    }

    // Soft delete
    comment.isDeleted = true;
    comment.updatedAt = new Date();

    await commentRepository.save(comment);
    this.logger.log(`Soft deleted comment ${commentId}`);

    return {
      status: 'success',
      message: 'Comment deleted successfully',
      data: null,
      timestamp: new Date(),
    };
  }

  /**
   * Like/Dislike a comment
   * @param commentId Comment ID
   * @param userId User ID
   * @param isLike true for like, false for dislike
   * @returns Updated comment information
   */
  async likeComment(
    commentId: number,
    userId: number,
    isLike: boolean,
  ): Promise<ResultType<{ likes: number; dislikes: number }>> {
    this.logger.log(
      `User ${userId} ${isLike ? 'liking' : 'disliking'} comment ${commentId}`,
    );

    const commentRepository = this.dataSource.getRepository(
      CommunityCommentEntity,
    );
    const userRepository = this.dataSource.getRepository(CommunityUserEntity);

    const comment = await commentRepository.findOne({
      where: { id: commentId },
    });

    if (!comment) {
      this.logger.warn(`Comment ${commentId} not found`);
      throw new NotFoundException('Comment not found');
    }

    const user = await userRepository.findOne({
      where: { id: userId },
    });

    if (!user) {
      this.logger.warn(`User ${userId} not found`);
      throw new NotFoundException('User not found');
    }

    if (comment.isDeleted) {
      this.logger.warn(
        `Attempted to like/dislike deleted comment ${commentId}`,
      );
      throw new BadRequestException('Cannot like/dislike deleted comments');
    }

    // Update like/dislike count
    if (isLike) {
      comment.likes += 1;
    } else {
      comment.dislikes += 1;
    }

    await commentRepository.save(comment);
    this.logger.log(
      `Updated ${isLike ? 'likes' : 'dislikes'} for comment ${commentId}`,
    );

    return {
      status: 'success',
      message: isLike
        ? 'Like added successfully'
        : 'Dislike added successfully',
      data: { likes: comment.likes, dislikes: comment.dislikes },
      timestamp: new Date(),
    };
  }
}
