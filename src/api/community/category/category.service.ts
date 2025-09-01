import { Injectable, NotFoundException } from '@nestjs/common';
import { CommunityCategoryEntity } from 'src/common/entities/community/category.entity';
import { CommunityPostEntity } from 'src/common/entities/community/post.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class CategoryService {
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Retrieves all community categories
   * @returns Promise containing an array of category entities
   */
  async getCategories(): Promise<ResultType<CommunityCategoryEntity[]>> {
    const categoryRepository = this.dataSource.getRepository(
      CommunityCategoryEntity,
    );
    const categories = await categoryRepository.find();
    return {
      status: 'success',
      message: 'Successfully retrieved categories',
      data: categories,
      timestamp: new Date(),
    };
  }

  /**
   * Retrieves information about a specific category including related posts
   * @param id The ID of the category to retrieve
   * @param page The page number for pagination
   * @returns Promise containing the category entity with related posts
   */
  async getInfo(
    id: number,
    page: number,
  ): Promise<
    ResultType<{
      category: CommunityCategoryEntity;
      posts: CommunityPostEntity[];
      totalPages: number;
    }>
  > {
    const categoryRepository = this.dataSource.getRepository(
      CommunityCategoryEntity,
    );
    const postRepository = this.dataSource.getRepository(CommunityPostEntity);
    const category = await categoryRepository.findOne({
      where: { id },
    });
    if (!category) throw new NotFoundException('Category not found');

    const posts = await postRepository.find({
      where: {
        category,
        isDeleted: false,
      },
      relations: {
        badge: true,
      },
      take: 15,
      skip: (page - 1) * 15,
    });

    const counts = await postRepository.count({
      where: {
        category,
        isDeleted: false,
      },
    });

    const res: {
      category: CommunityCategoryEntity;
      posts: CommunityPostEntity[];
      totalPages: number;
    } = {
      category,
      posts,
      totalPages: Math.floor(counts / 15),
    };

    return {
      status: 'success',
      message: 'Successfully retrieved category information',
      data: res,
      timestamp: new Date(),
    };
  }
}
