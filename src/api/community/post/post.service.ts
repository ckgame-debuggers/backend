import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { CommunityNewPostDto } from 'src/common/dto/community/post/new-post.dto';
import { CommunityUpdatePostDto } from 'src/common/dto/community/post/update-post.dto';
import { CommunityCategoryEntity } from 'src/common/entities/community/category.entity';
import { CommunityPostEntity } from 'src/common/entities/community/post.entity';
import { CommunityUserEntity } from 'src/common/entities/community/user.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { CloudflareService } from 'src/providers/cloudflare/cloudflare.service';
import { DataSource } from 'typeorm';

@Injectable()
export class PostService {
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
          relations: ['category', 'writer', 'writer.user', 'badge'],
        });
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
  async getPost(id: number): Promise<ResultType<CommunityPostEntity>> {
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
    if (!found) throw new NotFoundException('Post not found.');
    return {
      status: 'success',
      message: 'Successfully retrieved post',
      data: found,
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
    const postRepository = this.dataSource.getRepository(CommunityPostEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);
    const communityUserRepository =
      this.dataSource.getRepository(CommunityUserEntity);
    const categoryRepository = this.dataSource.getRepository(
      CommunityCategoryEntity,
    );

    console.log(userId);

    // Find user and their community profile
    const user = await userRepository.findOneBy({ id: userId });
    if (!user) throw new ConflictException("Couldn't find user");
    const communityUser = await communityUserRepository.findOne({
      where: { user: { id: userId } },
      relations: ['defaultBadge'],
    });
    if (!communityUser)
      throw new ConflictException("Couldn't find user community entity");

    // Find selected category
    const category = await categoryRepository.findOneBy({
      id: newPostDto.category,
    });
    if (!category) throw new ConflictException("Couldn't find category");

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

    if (newPostDto.thumbnail) post.thumbnail = newPostDto.thumbnail;

    await postRepository.save(post);
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
      throw new NotFoundException('Post not found');
    }

    // Check if the user is the owner of the post
    if (post.writer.user.id !== userId) {
      throw new ForbiddenException('자신의 게시글만 수정할 수 있습니다.');
    }

    // Check if the post is deleted
    if (post.isDeleted) {
      throw new ConflictException('삭제된 게시글은 수정할 수 없습니다.');
    }

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
      const category = await categoryRepository.findOneBy({
        id: updatePostDto.category,
      });
      if (!category) {
        throw new ConflictException("Couldn't find category");
      }
      post.category = category;
    }

    // Save the updated post
    await postRepository.save(post);

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
    const postRepository = this.dataSource.getRepository(CommunityPostEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    const reqUser = await userRepository.findOneBy({ id: userId });
    if (!reqUser) {
      throw new NotFoundException('사용자를 찾을 수 없습니다.');
    }

    // Find the existing post
    const post = await postRepository.findOne({
      where: { id: postId },
      relations: ['writer', 'writer.user', 'comments'],
    });

    if (!post) {
      throw new NotFoundException('게시글을 찾을 수 없습니다.');
    }

    if (post.isDeleted) {
      throw new ConflictException('이미 삭제된 게시글입니다.');
    }

    // Check if the user is the owner of the post or has admin permission
    const isOwner = post.writer.user.id === userId;
    const isAdmin = reqUser.permission >= 3; // Admin level 3 or higher

    if (!isOwner && !isAdmin) {
      throw new ForbiddenException('자신의 게시글만 삭제할 수 있습니다.');
    }

    // Soft delete the post
    post.isDeleted = true;
    await postRepository.save(post);

    return {
      status: 'success',
      message: '게시글이 성공적으로 삭제되었습니다.',
      data: null,
      timestamp: new Date(),
    };
  }
}
