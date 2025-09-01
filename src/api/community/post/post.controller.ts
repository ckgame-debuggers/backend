import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { PostService } from './post.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { CommunityNewPostDto } from 'src/common/dto/community/post/new-post.dto';
import { CommunityUpdatePostDto } from 'src/common/dto/community/post/update-post.dto';
import { User } from 'src/common/decorator/get-user';

@Controller('community/post')
export class PostController {
  constructor(private readonly postService: PostService) {}

  @Get()
  async getAllPost() {
    return await this.postService.getAll();
  }

  @Get(':id')
  async getPost(@Param('id', ParseIntPipe) postId: number) {
    return await this.postService.getPost(postId);
  }

  @Post()
  @UseGuards(AuthGuard)
  async newPost(
    @Body(ValidationPipe) newPostDto: CommunityNewPostDto,
    @User('id') userId: number,
  ) {
    return await this.postService.newPost(newPostDto, userId);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async updatePost(
    @Param('id', ParseIntPipe) postId: number,
    @Body(ValidationPipe) updatePostDto: CommunityUpdatePostDto,
    @User('id') userId: number,
  ) {
    return await this.postService.updatePost(postId, updatePostDto, userId);
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async deletePost(
    @Param('id', ParseIntPipe) postId: number,
    @User('id') userId: number,
  ) {
    return await this.postService.deletePost(postId, userId);
  }
}
