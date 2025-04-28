import {
  Body,
  Controller,
  Get,
  Param,
  ParseIntPipe,
  Post,
  Query,
  UseGuards,
} from '@nestjs/common';
import { DebuggersService } from './debuggers.service';
import { DebuggersNewBugDto } from 'src/common/dto/debuggers/new-bug.dto';
import { DebuggersCommentDto } from 'src/common/dto/debuggers/comment.dto';
import { User } from 'src/common/decorator/get-user';
import { AuthGuard } from 'src/common/guards/auth.guard';

@Controller('debuggers')
export class DebuggersController {
  constructor(private readonly debuggersService: DebuggersService) {}

  @Post()
  @UseGuards(AuthGuard)
  async createBug(
    @Body() createBugDto: DebuggersNewBugDto,
    @User('id') userId: number,
  ) {
    return this.debuggersService.create(createBugDto, userId);
  }

  @Get('categories')
  async getCategories() {
    return this.debuggersService.getAllCategory();
  }

  @Get('bug/:id')
  async getBug(@Param('id', ParseIntPipe) bugId: number) {
    return this.debuggersService.getBug(bugId);
  }

  @Get()
  async getAllBugs(
    @Query('page', ParseIntPipe) page: number,
    @Query('take', ParseIntPipe) take: number,
  ) {
    return this.debuggersService.getAllBugs(page, take);
  }

  @Post('bug/:id/comment')
  @UseGuards(AuthGuard)
  async commentBug(
    @Body() commentDto: DebuggersCommentDto,
    @Param('id', ParseIntPipe) bugId: number,
    @User('id') userId: number,
  ) {
    return this.debuggersService.commentBug(commentDto, bugId, userId);
  }

  @Get('bug/:id/comment')
  async GetBugComments(@Param('id', ParseIntPipe) bugId: number) {
    return this.debuggersService.getAllComment(bugId);
  }
}
