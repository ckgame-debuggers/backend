import {
  Controller,
  Get,
  Logger,
  Post,
  Req,
  UseGuards,
  Delete,
  Put,
  Body,
  Param,
  ParseIntPipe,
  DefaultValuePipe,
  Query,
} from '@nestjs/common';
import { Request } from 'express';
import { CrewService } from './crew.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { JwtPayload } from 'src/common/dto/auth/jwt-payload.dto';
import { CrewCreateReqDto } from 'src/common/dto/crew/create-request.dto';
import { CrewCreateDto } from 'src/common/dto/crew/create.dto';
import { CrewApplicationDto } from 'src/common/dto/crew/application.dto';
import { CrewUpdateDto } from 'src/common/dto/crew/update.dto';
import { CrewSetRecruitingDto } from 'src/common/dto/crew/set-recruiting.dto';
import { User } from 'src/common/decorator/get-user';

@Controller('crew')
export class CrewController {
  private readonly logger = new Logger(CrewController.name);
  constructor(private readonly crewService: CrewService) {}

  @Post('request')
  @UseGuards(AuthGuard)
  async requestCreate(
    @Body() createCrewRequestDto: CrewCreateReqDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    const user: JwtPayload = req.user;
    this.logger.log('Creating new crew create request');
    return await this.crewService.requestCreate(createCrewRequestDto, user);
  }

  @Post('create')
  @UseGuards(AuthGuard)
  async create(
    @Body() createCrewDto: CrewCreateDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    this.logger.log('Creating new crew');
    return await this.crewService.create(createCrewDto, req.user);
  }

  @Get("/")
  async getAllCrews(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
  ) {
    this.logger.log('Fetching all crews');
    return await this.crewService.getAllCrews(page, take);
  }

  @Get('my')
  @UseGuards(AuthGuard)
  async getMyCrew(@User('id') userId: number) {
    this.logger.log(`Fetching crews for user ${userId}`);
    return await this.crewService.getMyCrew(userId);
  }

  @Get('application/:id')
  @UseGuards(AuthGuard)
  async getApplication(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetching application with id ${id}`);
    return await this.crewService.getApplication(id);
  }

  @Get('applications')
  @UseGuards(AuthGuard)
  async getAllApplications(
    @Query('page', new DefaultValuePipe(0), ParseIntPipe) page: number,
    @Query('take', new DefaultValuePipe(10), ParseIntPipe) take: number,
    @Query('crewId', ParseIntPipe) crewId: number,
  ) {
    this.logger.log('Fetching all applications');
    return await this.crewService.getAllApplications(page, take, crewId);
  }

  @Post('apply')
  @UseGuards(AuthGuard)
  async applyCrew(
    @Body() applyCrewDto: CrewApplicationDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    this.logger.log('Creating new crew application');
    return await this.crewService.applyCrew(applyCrewDto, req.user);
  }

  @Post('application/:id/accept')
  @UseGuards(AuthGuard)
  async acceptApplication(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    this.logger.log(`Accepting application with id ${id}`);
    return await this.crewService.acceptApplication(id, req.user);
  }

  @Delete('application/:id')
  @UseGuards(AuthGuard)
  async deleteApplication(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    this.logger.log(`Deleting application with id ${id}`);
    return await this.crewService.deleteApplication(id, req.user);
  }

  @Put(':id')
  @UseGuards(AuthGuard)
  async changeInfo(
    @Param('id', ParseIntPipe) id: number,
    @Body() updateCrewDto: CrewUpdateDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    this.logger.log(`Changing information for crew with id ${id}`);
    return await this.crewService.changeInfo(id, updateCrewDto, req.user);
  }

  @Post(':id/sub-owner')
  @UseGuards(AuthGuard)
  async setSubOwner(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    this.logger.log(`Setting sub-owner for crew with id ${id}`);
    return await this.crewService.setSubOwner(id, req.user.id, req.user);
  }

  @Post(':id/owner')
  @UseGuards(AuthGuard)
  async changeOwner(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    this.logger.log(`Changing owner for crew with id ${id}`);
    return await this.crewService.changeOwner(id, req.user.id, req.user);
  }

  @Get(':id')
  async getCrew(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetching crew with id ${id}`);
    return await this.crewService.getCrew(id);
  }

  @Get(':id/check-member')
  @UseGuards(AuthGuard)
  async checkIsMember(
    @Param('id', ParseIntPipe) crewId: number,
    @User('id') userId: number,
  ) {
    this.logger.log(`Checking if user ${userId} is member of crew ${crewId}`);
    return await this.crewService.checkIsMember(userId, crewId);
  }

  @Get(':id/members')
  async getCrewMembers(@Param('id', ParseIntPipe) id: number) {
    this.logger.log(`Fetching members for crew ${id}`);
    return await this.crewService.getCrewMember(id);
  }

  @Put(':id/recruiting')
  @UseGuards(AuthGuard)
  async setRecruiting(
    @Param('id', ParseIntPipe) id: number,
    @Body() setRecruitingDto: CrewSetRecruitingDto,
    @Req() req: Request & { user: JwtPayload },
  ) {
    this.logger.log(`Setting recruiting status for crew with id ${id}`);
    return await this.crewService.setRecruiting(
      id,
      setRecruitingDto.isRecruiting,
      req.user,
    );
  }

  @Delete(':id')
  @UseGuards(AuthGuard)
  async remove(
    @Param('id', ParseIntPipe) id: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    this.logger.log(`Removing crew with id ${id}`);
    return await this.crewService.remove(id, req.user);
  }

  @Post(':id/ban/:userId')
  @UseGuards(AuthGuard)
  async banMember(
    @Param('id', ParseIntPipe) crewId: number,
    @Param('userId', ParseIntPipe) userId: number,
    @Req() req: Request & { user: JwtPayload },
  ) {
    this.logger.log(`Banning user ${userId} from crew ${crewId}`);
    return await this.crewService.banMember(crewId, userId, req.user);
  }
}
