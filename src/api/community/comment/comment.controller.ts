import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Put,
  Query,
  UseGuards,
  ValidationPipe,
} from '@nestjs/common';
import { CommentService } from './comment.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { User } from 'src/common/decorator/get-user';
import { CreateCommentDto } from 'src/common/dto/community/comment/create-comment.dto';
import { UpdateCommentDto } from 'src/common/dto/community/comment/update-comment.dto';
import { CommentListDto } from 'src/common/dto/community/comment/comment-list.dto';

@Controller('community/posts/:postId/comments')
export class CommentController {
  constructor(private readonly commentService: CommentService) {}

  /**
   * 댓글 작성
   * POST /community/posts/:postId/comments
   */
  @Post()
  @UseGuards(AuthGuard)
  async createComment(
    @Param('postId', ParseIntPipe) postId: number,
    @User('id') userId: number,
    @Body(ValidationPipe) createCommentDto: CreateCommentDto,
  ) {
    return await this.commentService.createComment(
      postId,
      userId,
      createCommentDto,
    );
  }

  /**
   * 게시글의 댓글 목록 조회
   * GET /community/posts/:postId/comments
   */
  @Get()
  async getComments(
    @Param('postId', ParseIntPipe) postId: number,
    @Query(ValidationPipe) query: CommentListDto,
  ) {
    return await this.commentService.getComments(postId, query);
  }

  /**
   * 댓글 수정
   * PUT /community/posts/:postId/comments/:commentId
   */
  @Put(':commentId')
  @UseGuards(AuthGuard)
  async updateComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @User('id') userId: number,
    @Body(ValidationPipe) updateCommentDto: UpdateCommentDto,
  ) {
    return await this.commentService.updateComment(
      commentId,
      userId,
      updateCommentDto,
    );
  }

  /**
   * 댓글 삭제
   * DELETE /community/posts/:postId/comments/:commentId
   */
  @Delete(':commentId')
  @UseGuards(AuthGuard)
  async deleteComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @User('id') userId: number,
  ) {
    return await this.commentService.deleteComment(commentId, userId);
  }

  /**
   * 댓글 좋아요
   * POST /community/posts/:postId/comments/:commentId/like
   */
  @Post(':commentId/like')
  @UseGuards(AuthGuard)
  async likeComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @User('id') userId: number,
  ) {
    return await this.commentService.likeComment(commentId, userId, true);
  }

  /**
   * 댓글 싫어요
   * POST /community/posts/:postId/comments/:commentId/dislike
   */
  @Post(':commentId/dislike')
  @UseGuards(AuthGuard)
  async dislikeComment(
    @Param('commentId', ParseIntPipe) commentId: number,
    @User('id') userId: number,
  ) {
    return await this.commentService.likeComment(commentId, userId, false);
  }
}
