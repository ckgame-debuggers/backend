import { Controller, Get, Param, Query } from '@nestjs/common';
import { CategoryService } from './category.service';

@Controller('community/category')
export class CategoryController {
  constructor(private readonly categoryService: CategoryService) {}

  @Get()
  async getAllCategories() {
    return await this.categoryService.getCategories();
  }

  @Get(':id')
  async getCategory(
    @Param('id') categoryId: number,
    @Query('page') page: number,
  ) {
    return await this.categoryService.getInfo(categoryId, page ?? 1);
  }
}
