import {
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { JwtPayload } from 'src/common/dto/auth/jwt-payload.dto';
import { CrewApplicationDto } from 'src/common/dto/crew/application.dto';
import { CrewCreateReqDto } from 'src/common/dto/crew/create-request.dto';
import { CrewCreateDto } from 'src/common/dto/crew/create.dto';
import { CrewUpdateDto } from 'src/common/dto/crew/update.dto';
import { CrewApplicationEntity } from 'src/common/entities/crew/crew-application.entity';
import { CrewCreateRequestEntity } from 'src/common/entities/crew/crew-create-request.entity';
import { CrewMemberEntity } from 'src/common/entities/crew/crew-member.entity';
import { CrewEntity } from 'src/common/entities/crew/crew.entity';
import { UserEntity } from 'src/common/entities/user/user.entity';
import { DataSource } from 'typeorm';

@Injectable()
export class CrewService {
  private readonly logger = new Logger(CrewService.name);
  constructor(private readonly dataSource: DataSource) {}

  /**
   * Create a new request to create a new crew.
   * @param createReqDto
   * @param user
   * @returns
   */
  async requestCreate(
    createReqDto: CrewCreateReqDto,
    user: JwtPayload,
  ): Promise<ResultType<CrewCreateRequestEntity>> {
    this.logger.log('Creating new crew create request');
    const userRepository = this.dataSource.getRepository(UserEntity);
    const reqRepository = this.dataSource.getRepository(
      CrewCreateRequestEntity,
    );
    const requestUser = await userRepository.findOneBy({ id: user.id });
    if (!requestUser) {
      this.logger.error('Request user not found');
      throw new ConflictException('Request user not found.');
    }
    const request = reqRepository.create({
      title: createReqDto.title,
      description: createReqDto.description,
      isRecruiting: createReqDto.isRecruiting,
      maxPeople: createReqDto.maxPeople,
      user: requestUser,
    });
    await reqRepository.save(request);
    this.logger.log('Successfully created new create request');
    return {
      status: 'success',
      message: 'Successfully created new create request.',
      data: request,
      timestamp: new Date(),
    };
  }

  /**
   * Create a new crew based on create request
   * @param createDto information of create request
   * @param user current user
   * @returns result data to create new crew
   */
  async create(
    createDto: CrewCreateDto,
    user: JwtPayload,
  ): Promise<ResultType<CrewEntity>> {
    this.logger.log('Creating new crew');
    const userRepository = this.dataSource.getRepository(UserEntity);
    const crewRepository = this.dataSource.getRepository(CrewEntity);
    const crewMemberRepository =
      this.dataSource.getRepository(CrewMemberEntity);
    const reqRepository = this.dataSource.getRepository(
      CrewCreateRequestEntity,
    );
    const requestUser = await userRepository.findOneBy({ id: user.id });
    if (!requestUser) {
      this.logger.error('Requested user not found');
      throw new ConflictException('Requested user not found');
    }
    if (requestUser.permission < 2) {
      this.logger.error('Insufficient permissions');
      throw new ForbiddenException(
        'This action requires admin or higher permissions.',
      );
    }
    const date = new Date();
    const request = await reqRepository.findOne({
      where: { id: createDto.id },
      relations: {
        user: true,
      },
    });
    if (!request) {
      this.logger.error('Create request not found');
      throw new ConflictException('Create request not found');
    }
    const crewOwner = await userRepository.findOneBy({ id: request.user.id });
    if (!crewOwner) {
      this.logger.error('Crew owner not found');
      throw new ConflictException('Crew owner not found.');
    }
    const generated = crewRepository.create({
      title: request.title,
      createdAt: `${date.getFullYear()}년 ${date.getMonth() + 1}월 ${date.getDate()}일`,
      description: request.description,
      maxPeople: request.maxPeople,
      isRecruiting: request.isRecruiting,
    });
    await crewRepository.save(generated);
    const admin = crewMemberRepository.create({
      crew: generated,
      crewId: generated.id,
      user: crewOwner,
      userId: crewOwner.id,
      permission: 'Owner',
    });
    await crewMemberRepository.save(admin);
    this.logger.log('Successfully created new crew');
    return {
      status: 'success',
      message: 'Successfully created new crew.',
      data: generated,
      timestamp: new Date(),
    };
  }

  /**
   * Check if user is member of crew
   * @param userId id of user to check membership
   * @param crewId id of crew to check membership
   * @returns object containing membership status and permission level if member
   */
  async checkIsMember(
    userId: number,
    crewId: number,
  ): Promise<ResultType<{ isMember: boolean; permission?: string }>> {
    this.logger.log(`Checking if user ${userId} is member of crew ${crewId}`);
    const crewMemberRepository =
      this.dataSource.getRepository(CrewMemberEntity);
    const member = await crewMemberRepository.findOneBy({
      userId,
      crewId,
    });

    return {
      status: 'success',
      message: member ? 'User is a member' : 'User is not a member',
      data: {
        isMember: !!member,
        ...(member && { permission: member.permission }),
      },
      timestamp: new Date(),
    };
  }

  /**
   * Get crew with current id.
   * @param id id of crew to find.
   * @returns found crews
   */
  async getCrew(crewId: number): Promise<ResultType<CrewEntity>> {
    this.logger.log(`Fetching a crew item with id : ${crewId}`);
    const crewRepository = this.dataSource.getRepository(CrewEntity);
    const crew = await crewRepository.findOneBy({
      id: crewId,
    });
    if (!crew) {
      this.logger.error(`Crew with id ${crewId} not found`);
      throw new NotFoundException(`Crew with id ${crewId} not found.`);
    }
    this.logger.log(`Found ${crew?.title}`);
    return {
      status: 'success',
      message: `Found ${crew.title}`,
      data: crew,
      timestamp: new Date(),
    };
  }

  /**
   * Get crews that current user joined.
   * @param userId id of user to find crews
   * @returns found crews that user joined
   */
  async getMyCrew(userId: number): Promise<ResultType<CrewEntity[]>> {
    const crewMemberRepository =
      this.dataSource.getRepository(CrewMemberEntity);
    const found = await crewMemberRepository.find({
      where: {
        userId,
      },
      relations: {
        crew: true,
      },
    });
    return {
      status: 'success',
      message: `Found ${found.length} crews.`,
      data: found.map((member) => member.crew),
      timestamp: new Date(),
    };
  }

  /**
   * Get members of a specific crew
   * @param id The ID of the crew to get members for
   * @returns Array of crew members with user details
   */
  async getCrewMember(id: number): Promise<ResultType<CrewMemberEntity[]>> {
    this.logger.log(`Fetching member of crew : ${id}`);
    const crewRepository = this.dataSource.getRepository(CrewEntity);
    const crewMemberRepository =
      this.dataSource.getRepository(CrewMemberEntity);

    const crew = await crewRepository.findOneBy({ id });
    if (!crew) {
      throw new NotFoundException('Crew not found');
    }
    const members = await crewMemberRepository.find({
      where: {
        crewId: crew.id,
      },
      relations: {
        user: true,
      },
      select: {
        user: {
          schoolNumber: true,
          fullname: true,
        },
      },
    });
    return {
      status: 'success',
      message: `Found ${members.length} members`,
      data: members,
      timestamp: new Date(),
    };
  }

  /**
   * Get all crews with pagination.
   * @param page current index of page
   * @param take crews per page
   * @returns found crews
   */ async getAllCrews(
    page: number,
    take: number,
  ): Promise<ResultType<CrewEntity[]>> {
    this.logger.log(
      `Fetching crews for page ${page} with ${take} items per page`,
    );
    const crewRepository = this.dataSource.getRepository(CrewEntity);
    const crews = await crewRepository.find({
      take,
      skip: page * take,
      order: {
        createdAt: 'DESC',
      },
    });
    this.logger.log(`Found ${crews.length} crews`);
    return {
      status: 'success',
      message: `Found ${crews.length} crews.`,
      data: crews,
      timestamp: new Date(),
    };
  }

  /**
   * Create new application for current crew.
   * @param crewApplicationDto contains data to apply for crew.
   * @param user current requesting user
   * @returns result data for creating new application.
   */
  async applyCrew(
    crewApplicationDto: CrewApplicationDto,
    user: JwtPayload,
  ): Promise<ResultType<CrewApplicationEntity>> {
    this.logger.log('Creating new crew application');
    const userRepository = this.dataSource.getRepository(UserEntity);
    const crewRepository = this.dataSource.getRepository(CrewEntity);
    const applicationRepository = this.dataSource.getRepository(
      CrewApplicationEntity,
    );
    const reqUser = await userRepository.findOneBy({ id: user.id });
    if (!reqUser) {
      this.logger.error('Requested user not found');
      throw new ConflictException('Requested user not found.');
    }
    const crew = await crewRepository.findOneBy({
      id: crewApplicationDto.crewId,
    });
    if (!crew) {
      this.logger.error('Crew item not found');
      throw new NotFoundException('Crew item not found.');
    }
    const generated = applicationRepository.create({
      contact: crewApplicationDto.contact,
      motivation: crewApplicationDto.motivation,
      user: reqUser,
      crew,
    });
    await applicationRepository.save(generated);
    this.logger.log('Successfully created new application');
    return {
      status: 'success',
      message: 'New application item generated.',
      data: generated,
      timestamp: new Date(),
    };
  }

  /**
   * Get an application with id
   * @param applicationId an id to find application
   * @returns found application data
   */
  async getApplication(
    applicationId: number,
  ): Promise<ResultType<CrewApplicationEntity>> {
    this.logger.log(`Fetching an application item with id : ${applicationId}`);
    const applicationRepository = this.dataSource.getRepository(
      CrewApplicationEntity,
    );
    const found = await applicationRepository.findOneBy({
      id: applicationId,
    });
    if (!found) {
      this.logger.error(`Application with id ${applicationId} not found`);
      throw new NotFoundException(
        `Application with id ${applicationId} not found.`,
      );
    }
    this.logger.log(`Found application with id : ${applicationId}`);
    return {
      status: 'success',
      message: `Found an application item with id : ${applicationId}`,
      data: found,
      timestamp: new Date(),
    };
  }

  /**
   * Get applications with pagination
   * @param page index of page
   * @param take items per page
   * @param crewId id of crew
   * @returns found data
   */
  async getAllApplications(
    page: number,
    take: number,
    crewId: number,
  ): Promise<ResultType<CrewApplicationEntity[]>> {
    this.logger.log(
      `Fetching applications for crew with id ${crewId} for page ${page} with ${take} items per page`,
    );
    const crewRepository = this.dataSource.getRepository(CrewEntity);
    const applicationRepository = this.dataSource.getRepository(
      CrewApplicationEntity,
    );
    const crew = await crewRepository.findOneBy({ id: crewId });
    if (!crew) {
      this.logger.error(`Crew with id ${crewId} not found`);
      throw new NotFoundException(`Crew with id ${crewId} not found.`);
    }
    const applications = await applicationRepository.find({
      where: { crew: crew },
      skip: page * take,
      take,
    });
    this.logger.log(`Found ${applications.length} applications`);
    return {
      status: 'success',
      message: `Successfully got ${applications.length} items.`,
      data: applications,
      timestamp: new Date(),
    };
  }

  /**
   * Accept an application based on the application ID
   * @param applicationId ID of the application to be accepted
   * @param user current user
   * @returns result data of the accepted application
   */
  async acceptApplication(
    applicationId: number,
    user: JwtPayload,
  ): Promise<ResultType<CrewMemberEntity>> {
    this.logger.log(`Accepting application with id ${applicationId}`);
    const userRepository = this.dataSource.getRepository(UserEntity);
    const crewRepository = this.dataSource.getRepository(CrewEntity);
    const crewMemberRepository =
      this.dataSource.getRepository(CrewMemberEntity);
    const applicationRepository = this.dataSource.getRepository(
      CrewApplicationEntity,
    );
    const userItem = await userRepository.findOneBy({ id: user.id });
    if (!userItem) {
      this.logger.error('Requested user not found');
      throw new ConflictException('Requested user not found.');
    }
    const application = await applicationRepository.findOne({
      where: {
        id: applicationId,
      },
      relations: { crew: true },
    });
    if (!application) {
      this.logger.error('Application not found');
      throw new NotFoundException('Application not found.');
    }
    const crew = await crewRepository.findOneBy({ id: application.crew.id });
    if (!crew) {
      this.logger.error('Requested crew not found');
      throw new ConflictException('Requested crew not found.');
    }
    const requestedUserPerm = await crewMemberRepository.findOneBy({
      user: userItem,
    });
    if (!requestedUserPerm) {
      this.logger.error('You are not a crew member');
      throw new ConflictException('You are not a crew member.');
    }
    if (!['Owner', 'Sub-Owner'].includes(requestedUserPerm.permission)) {
      this.logger.error('Insufficient permissions');
      throw new ForbiddenException(
        'You need at least sub-owner permission to accept a crew application',
      );
    }
    const generated = crewMemberRepository.create({
      user: userItem,
      crew: crew,
      userId: userItem.id,
      crewId: crew.id,
      permission: 'Member',
    });
    await crewMemberRepository.save(generated);
    await applicationRepository.remove([application]);
    this.logger.log(
      `Successfully accepted application with id ${applicationId}`,
    );
    return {
      status: 'success',
      message: `Successfully accepted application with id ${applicationId}`,
      data: generated,
      timestamp: new Date(),
    };
  }

  /**
   * Delete crew application item.
   * @param applicationId
   * @param user
   * @returns
   */
  async deleteApplication(
    applicationId: number,
    user: JwtPayload,
  ): Promise<ResultType> {
    this.logger.log(`Deleting application with id ${applicationId}`);
    const userRepository = this.dataSource.getRepository(UserEntity);
    const crewMemberRepository =
      this.dataSource.getRepository(CrewMemberEntity);
    const applicationRepository = this.dataSource.getRepository(
      CrewApplicationEntity,
    );
    const application = await applicationRepository.findOne({
      where: {
        id: applicationId,
      },
      relations: {
        crew: true,
      },
    });
    if (!application) {
      this.logger.error('Application item not found');
      throw new NotFoundException('Application item not found');
    }
    const reqUser = await userRepository.findOneBy({ id: user.id });
    if (!reqUser) {
      this.logger.error('Requested user not found');
      throw new ConflictException('Requested user not found.');
    }
    const requestedUserPerm = await crewMemberRepository.findOneBy({
      user: reqUser,
    });
    if (reqUser.permission < 2) {
      if (!requestedUserPerm) {
        this.logger.error('You are not a crew member');
        throw new ConflictException('You are not a crew member.');
      }
      if (!['Owner', 'Sub-Owner'].includes(requestedUserPerm.permission)) {
        this.logger.error('Insufficient permissions');
        throw new ForbiddenException(
          'You need at least sub-owner permission to remove a crew application',
        );
      }
    }
    await applicationRepository.remove(application);
    this.logger.log(
      `Successfully deleted application with id ${applicationId}`,
    );
    return {
      status: 'success',
      message: 'Successfully deleted application data.',
      timestamp: new Date(),
    };
  }
  /**
   * Change crew information.
   * @param crewId id of the crew to change information
   * @param updateDto data to update
   * @param user current user
   * @returns updated crew data
   */
  async changeInfo(
    crewId: number,
    updateDto: CrewUpdateDto,
    user: JwtPayload,
  ): Promise<ResultType<CrewEntity>> {
    this.logger.log(`Changing information for crew with id ${crewId}`);
    const crewRepository = this.dataSource.getRepository(CrewEntity);
    const crewMemberRepository =
      this.dataSource.getRepository(CrewMemberEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);
    const crew = await crewRepository.findOneBy({ id: crewId });
    if (!crew) {
      this.logger.error(`Crew with id ${crewId} not found`);
      throw new NotFoundException(`Crew with id ${crewId} not found.`);
    }
    const userPermission = await crewMemberRepository.findOneBy({
      crew,
      user: { id: user.id },
    });
    const reqUser = await userRepository.findOneBy({ id: user.id });
    if (!reqUser) {
      this.logger.error('Requested user not found');
      throw new ConflictException('Requested user not found.');
    }
    if (
      (!userPermission ||
        !['Owner', 'Sub-Owner'].includes(userPermission.permission)) &&
      reqUser.permission < 2
    ) {
      this.logger.error('Insufficient permissions');
      throw new ForbiddenException(
        'You need at least sub-owner permission or user permission 2 or higher to change crew information.',
      );
    }
    Object.assign(crew, updateDto.to);
    await crewRepository.save(crew);
    this.logger.log(
      `Successfully updated information for crew with id ${crewId}`,
    );
    return {
      status: 'success',
      message: 'Successfully updated crew information.',
      data: crew,
      timestamp: new Date(),
    };
  }

  /**
   * Ban a member from the crew.
   * @param crewId id of the crew to ban member from
   * @param userId id of the user to ban
   * @param user current user performing the ban
   */
  async banMember(
    crewId: number,
    userId: number,
    user: JwtPayload,
  ): Promise<ResultType> {
    this.logger.log(`Setting sub-owner for crew with id ${crewId}`);
    const crewMemberRepository =
      this.dataSource.getRepository(CrewMemberEntity);
    const crewRepository = this.dataSource.getRepository(CrewEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);
    const crew = await crewRepository.findOneBy({ id: crewId });
    if (!crew) {
      this.logger.error(`Crew with id ${crewId} not found`);
      throw new NotFoundException(`Crew with id ${crewId} not found.`);
    }
    const userPermission = await crewMemberRepository.findOneBy({
      crew,
      user: { id: user.id },
    });
    const reqUser = await userRepository.findOneBy({ id: user.id });
    if (!reqUser) {
      this.logger.error('Requested user not found');
      throw new ConflictException('Requested user not found.');
    }
    if (
      (!userPermission ||
        ['Owner', 'Sub-Owner'].indexOf(userPermission.permission) === -1) &&
      reqUser.permission < 2
    ) {
      this.logger.error('Insufficient permissions');
      throw new ForbiddenException(
        'Only the owner or user with permission 2 or higher can set a sub-owner.',
      );
    }

    const found = await crewMemberRepository.findOneBy({
      userId: userId,
      crewId: crewId,
    });
    if (!found) throw new NotFoundException('User not found in crew');

    await crewMemberRepository.remove(found);

    return {
      status: 'success',
      message: 'Successfully banned member from crew.',
      timestamp: new Date(),
    };
  }

  /**
   * Set a sub-owner for the crew.
   * @param crewId id of the crew
   * @param userId id of the user to set as sub-owner
   * @param user current user
   * @returns updated crew member data
   */
  async setSubOwner(
    crewId: number,
    userId: number,
    user: JwtPayload,
  ): Promise<ResultType<CrewMemberEntity>> {
    this.logger.log(`Setting sub-owner for crew with id ${crewId}`);
    const crewMemberRepository =
      this.dataSource.getRepository(CrewMemberEntity);
    const crewRepository = this.dataSource.getRepository(CrewEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);
    const crew = await crewRepository.findOneBy({ id: crewId });
    if (!crew) {
      this.logger.error(`Crew with id ${crewId} not found`);
      throw new NotFoundException(`Crew with id ${crewId} not found.`);
    }
    const userPermission = await crewMemberRepository.findOneBy({
      crew,
      user: { id: user.id },
    });
    const reqUser = await userRepository.findOneBy({ id: user.id });
    if (!reqUser) {
      this.logger.error('Requested user not found');
      throw new ConflictException('Requested user not found.');
    }
    if (
      (!userPermission || userPermission.permission !== 'Owner') &&
      reqUser.permission < 2
    ) {
      this.logger.error('Insufficient permissions');
      throw new ForbiddenException(
        'Only the owner or user with permission 2 or higher can set a sub-owner.',
      );
    }
    const crewMember = await crewMemberRepository.findOneBy({
      crew,
      user: { id: userId },
    });
    if (!crewMember) {
      this.logger.error(`User with id ${userId} not found in the crew`);
      throw new NotFoundException(
        `User with id ${userId} not found in the crew.`,
      );
    }
    // Set sub-owner permission
    crewMember.permission = 'Sub-Owner';
    await crewMemberRepository.save(crewMember);
    this.logger.log(`Successfully set sub-owner for crew with id ${crewId}`);
    return {
      status: 'success',
      message: 'Successfully set sub-owner.',
      data: crewMember,
      timestamp: new Date(),
    };
  }

  /**
   * Change the owner of the crew.
   * @param crewId id of the crew
   * @param newOwnerId id of the new owner
   * @param user current user
   * @returns updated crew member data
   */
  async changeOwner(
    crewId: number,
    newOwnerId: number,
    user: JwtPayload,
  ): Promise<ResultType<CrewMemberEntity>> {
    this.logger.log(`Changing owner for crew with id ${crewId}`);
    const crewMemberRepository =
      this.dataSource.getRepository(CrewMemberEntity);
    const crewRepository = this.dataSource.getRepository(CrewEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);
    const crew = await crewRepository.findOneBy({ id: crewId });
    if (!crew) {
      this.logger.error(`Crew with id ${crewId} not found`);
      throw new NotFoundException(`Crew with id ${crewId} not found.`);
    }
    const userPermission = await crewMemberRepository.findOneBy({
      crew,
      user: { id: user.id },
    });
    const reqUser = await userRepository.findOneBy({ id: user.id });
    if (!reqUser) {
      this.logger.error('Requested user not found');
      throw new ConflictException('Requested user not found.');
    }
    if (
      (!userPermission || userPermission.permission !== 'Owner') &&
      reqUser.permission < 2
    ) {
      this.logger.error('Insufficient permissions');
      throw new ForbiddenException(
        'Only the owner or user with permission 2 or higher can change the owner.',
      );
    }
    const newOwner = await crewMemberRepository.findOneBy({
      crew,
      user: { id: newOwnerId },
    });
    if (!newOwner) {
      this.logger.error(`User with id ${newOwnerId} not found in the crew`);
      throw new NotFoundException(
        `User with id ${newOwnerId} not found in the crew.`,
      );
    }
    // Change owner permission
    newOwner.permission = 'Owner';
    await crewMemberRepository.save(newOwner);
    this.logger.log(`Successfully changed owner for crew with id ${crewId}`);
    return {
      status: 'success',
      message: 'Successfully changed owner.',
      data: newOwner,
      timestamp: new Date(),
    };
  }

  /**
   * Set the recruiting status of the crew.
   * @param crewId id of the crew
   * @param isRecruiting recruiting status
   * @param user current user
   * @returns updated crew data
   */
  async setRecruiting(
    crewId: number,
    isRecruiting: boolean,
    user: JwtPayload,
  ): Promise<ResultType<CrewEntity>> {
    this.logger.log(`Setting recruiting status for crew with id ${crewId}`);
    const crewRepository = this.dataSource.getRepository(CrewEntity);
    const crewMemberRepository =
      this.dataSource.getRepository(CrewMemberEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);
    const crew = await crewRepository.findOneBy({ id: crewId });
    if (!crew) {
      this.logger.error(`Crew with id ${crewId} not found`);
      throw new NotFoundException(`Crew with id ${crewId} not found.`);
    }
    const userPermission = await crewMemberRepository.findOneBy({
      crew,
      user: { id: user.id },
    });
    const reqUser = await userRepository.findOneBy({ id: user.id });
    if (!reqUser) {
      this.logger.error('Requested user not found');
      throw new ConflictException('Requested user not found.');
    }
    if (
      (!userPermission ||
        !['Owner', 'Sub-Owner'].includes(userPermission.permission)) &&
      reqUser.permission < 2
    ) {
      this.logger.error('Insufficient permissions');
      throw new ForbiddenException(
        'You need at least sub-owner permission or user permission 2 or higher to set recruiting status.',
      );
    }
    // Set recruiting status
    crew.isRecruiting = isRecruiting;
    await crewRepository.save(crew);
    this.logger.log(
      `Successfully updated recruiting status for crew with id ${crewId}`,
    );
    return {
      status: 'success',
      message: 'Successfully updated recruiting status.',
      data: crew,
      timestamp: new Date(),
    };
  }

  /**
   * Remove a crew.
   * @param crewId id of the crew to remove
   * @param user current user
   * @returns result of the removal
   */
  async remove(crewId: number, user: JwtPayload): Promise<ResultType> {
    this.logger.log(`Removing crew with id ${crewId}`);
    const crewRepository = this.dataSource.getRepository(CrewEntity);
    const crewMemberRepository =
      this.dataSource.getRepository(CrewMemberEntity);
    const userRepository = this.dataSource.getRepository(UserEntity);
    const crew = await crewRepository.findOneBy({ id: crewId });
    if (!crew) {
      this.logger.error(`Crew with id ${crewId} not found`);
      throw new NotFoundException(`Crew with id ${crewId} not found.`);
    }
    const userPermission = await crewMemberRepository.findOneBy({
      crew,
      user: { id: user.id },
    });
    const reqUser = await userRepository.findOneBy({ id: user.id });
    if (!reqUser) {
      this.logger.error('Requested user not found');
      throw new ConflictException('Requested user not found.');
    }
    if (
      (!userPermission || userPermission.permission !== 'Owner') &&
      reqUser.permission < 2
    ) {
      this.logger.error('Insufficient permissions');
      throw new ForbiddenException(
        'Only the owner or user with permission 2 or higher can remove the crew.',
      );
    }
    await crewRepository.remove(crew);
    this.logger.log(`Successfully removed crew with id ${crewId}`);
    return {
      status: 'success',
      message: 'Successfully removed crew.',
      timestamp: new Date(),
    };
  }
}
