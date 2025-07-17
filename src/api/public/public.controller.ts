import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Put,
  UseGuards,
} from '@nestjs/common';
import { PublicService } from './public.service';
import { CreateOauth2Dto } from 'src/common/dto/oauth2/create.dto';
import { UpdateOauth2Dto } from 'src/common/dto/oauth2/update.dto';
import { UpdateScopeDto } from 'src/common/dto/oauth2/update-scope.dto';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { User } from 'src/common/decorator/get-user';

@Controller('public')
@UseGuards(AuthGuard)
export class PublicController {
  constructor(private readonly publicService: PublicService) {}

  @Get()
  async getPublicInfo() {
    return this.publicService.getPublicInfo();
  }

  // Application management functionalities
  @Post('applications')
  async createApplication(
    @Body() createDto: CreateOauth2Dto,
    @User('id') userId: number,
  ) {
    return this.publicService.createApplication(createDto, userId);
  }

  @Get('applications')
  async getApplications(@User('id') userId: number) {
    return this.publicService.getApplications(userId);
  }

  @Get('applications/:id')
  async getApplication(@Param('id') id: string, @User('id') userId: number) {
    return this.publicService.getApplication(id, userId);
  }

  @Put('applications/:id')
  async updateApplication(
    @Param('id') id: string,
    @Body() updateDto: UpdateOauth2Dto,
    @User('id') userId: number,
  ) {
    return this.publicService.updateApplication(id, updateDto, userId);
  }

  @Put('applications/:id/title')
  async updateApplicationTitle(
    @Param('id') id: string,
    @Body('title') title: string,
    @User('id') userId: number,
  ) {
    return this.publicService.updateApplicationTitle(id, title, userId);
  }

  @Put('applications/:id/profile')
  async updateApplicationProfile(
    @Param('id') id: string,
    @Body('profile') profile: string,
    @User('id') userId: number,
  ) {
    return this.publicService.updateApplicationProfile(id, profile, userId);
  }

  @Put('applications/:id/secret')
  async updateApplicationSecret(
    @Param('id') id: string,
    @User('id') userId: number,
  ) {
    return this.publicService.updateApplicationSecret(id, userId);
  }

  @Put('applications/:id/scopes')
  async updateApplicationScopes(
    @Param('id') id: string,
    @Body() updateScopeDto: UpdateScopeDto,
    @User('id') userId: number,
  ) {
    return this.publicService.updateApplicationScopes(
      id,
      updateScopeDto.scopes,
      userId,
    );
  }

  @Delete('applications/:id')
  async deleteApplication(@Param('id') id: string, @User('id') userId: number) {
    return this.publicService.deleteApplication(id, userId);
  }
}
