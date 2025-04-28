import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { DebuggersCommentDto } from 'src/common/dto/debuggers/comment.dto';
import { DebuggersNewBugDto } from 'src/common/dto/debuggers/new-bug.dto';
import { DebuggersBugEntity } from 'src/common/entities/debuggers/bug.entity';
import { DebuggersCategoryEntity } from 'src/common/entities/debuggers/category.entity';
import { DebuggersCommentEntity } from 'src/common/entities/debuggers/comment.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class DebuggersService {
  private readonly logger = new Logger(DebuggersService.name);
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Creates a new bug report in the system
   * @param createBugDto The DTO containing bug creation details
   * @param userId The ID of the user creating the bug
   * @returns Response object containing the created bug along with status, message, and timestamp
   */
  async create(
    createBugDto: DebuggersNewBugDto,
    userId: number,
  ): Promise<ResultType<DebuggersBugEntity>> {
    const bugRepository = this.dataSource.getRepository(DebuggersBugEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);
    const categoryRepository = this.dataSource.getRepository(
      DebuggersCategoryEntity,
    );

    const category = await categoryRepository.findOneBy({
      id: createBugDto.categoryId,
    });
    if (!category)
      throw new ConflictException(
        `Category with id ${createBugDto.categoryId} not found.`,
      );
    const user = await userRepository.findOneBy({
      id: userId,
    });

    if (!user) throw new ForbiddenException('User not found');

    const date = new Date();
    const totalBugs = await bugRepository.count();
    const newBug = bugRepository.create({
      title: createBugDto.title,
      contents: createBugDto.contents,
      solved: false,
      debuggersAnswer: '',
      createdAt: `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`,
      index: totalBugs + 1,
      writer: user,
    });
    await bugRepository.save(newBug);
    return {
      status: 'success',
      message: `Created new bug.`,
      data: newBug,
      timestamp: new Date(),
    };
  }

  /**
   * Retrieves all bug categories from the system
   * @returns Response object containing array of categories along with status, message, and timestamp
   */
  async getAllCategory(): Promise<ResultType<DebuggersCategoryEntity[]>> {
    const categoryRepository = this.dataSource.getRepository(
      DebuggersCategoryEntity,
    );
    const found = await categoryRepository.find();
    return {
      status: 'success',
      message: 'Found all categories.',
      data: found,
      timestamp: new Date(),
    };
  }

  /**
   * Fetches a single bug by its ID
   * @param bugId The ID of the bug to retrieve
   * @returns Response object containing the bug along with status, message, and timestamp
   */
  async getBug(bugId: number): Promise<ResultType<DebuggersBugEntity>> {
    const bugRepository = this.dataSource.getRepository(DebuggersBugEntity);
    const found = await bugRepository.findOneBy({
      id: bugId,
    });
    if (!found) throw new NotFoundException('Bug not found');
    return {
      status: 'success',
      message: `Found bug with id : ${bugId}.`,
      data: found,
      timestamp: new Date(),
    };
  }

  /**
   * Fetches all bugs with pagination.
   * @param page Page number (starts from 0)
   * @param take Number of items per page
   * @returns Response object containing bug list along with status, message, and timestamp
   */
  async getAllBugs(
    page: number,
    take: number,
  ): Promise<ResultType<DebuggersBugEntity[]>> {
    this.logger.log(
      `Fetching bugs for page ${page} with ${take} items per page`,
    );
    const bugRepository = this.dataSource.getRepository(DebuggersBugEntity);
    const bugs = await bugRepository.find({
      take,
      skip: page * take,
      order: {
        index: 'DESC',
      },
    });
    this.logger.log(`Found ${bugs.length} bugs`);
    return {
      status: 'success',
      message: `Found ${bugs.length} bugs.`,
      data: bugs,
      timestamp: new Date(),
    };
  }

  /**
   * Creates a new comment on a bug
   * @param commentDto The comment data transfer object containing the comment contents
   * @param bugId The ID of the bug to comment on
   * @param userId The ID of the user creating the comment
   * @returns Response object containing the created comment along with status, message, and timestamp
   */
  async commentBug(
    commentDto: DebuggersCommentDto,
    bugId: number,
    userId: number,
  ): Promise<ResultType<DebuggersCommentEntity>> {
    const commentRepository = this.dataSource.getRepository(
      DebuggersCommentEntity,
    );
    const bugRepository = this.dataSource.getRepository(DebuggersBugEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);

    const bug = await bugRepository.findOneBy({
      id: bugId,
    });
    if (!bug) throw new NotFoundException('Bug not found');
    const user = await userRepository.findOneBy({
      id: userId,
    });
    if (!user) throw new ForbiddenException('You must login to comment bug');

    const date = new Date();
    const newComment = commentRepository.create({
      contents: commentDto.contents,
      writer: user,
      createdAt: `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`,
      bug,
    });
    await commentRepository.save(newComment);
    return {
      status: 'success',
      message: `Create new comment to bug ${bugId}`,
      data: newComment,
      timestamp: new Date(),
    };
  }
  /**
   * Gets all comments for a specific bug
   * @param bugId The ID of the bug to get comments for
   * @returns Response object containing array of comments along with status, message, and timestamp
   */
  async getAllComment(
    bugId: number,
  ): Promise<ResultType<DebuggersCommentEntity[]>> {
    const commentRepository = this.dataSource.getRepository(
      DebuggersCommentEntity,
    );
    const bugRepository = this.dataSource.getRepository(DebuggersBugEntity);
    const bug = await bugRepository.findOneBy({
      id: bugId,
    });
    if (!bug) throw new NotFoundException('Bug not found');
    const foundComments = await commentRepository.find({
      where: {
        bug: { id: bugId },
      },
      relations: {
        writer: true,
      },
      select: {
        writer: {
          username: true,
          schoolNumber: true,
        },
      },
    });
    return {
      status: 'success',
      message: `Found ${foundComments.length} comments of bug ${bugId}`,
      data: foundComments,
      timestamp: new Date(),
    };
  }
}
