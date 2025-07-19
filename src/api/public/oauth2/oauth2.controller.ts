import {
  Body,
  Controller,
  Get,
  Headers,
  Param,
  Post,
  Query,
  UseGuards,
  BadRequestException,
} from '@nestjs/common';
import { Oauth2Service } from './oauth2.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { User } from 'src/common/decorator/get-user';
import { Oauth2GetTokenDto } from 'src/common/dto/oauth2/get-token.dto';
import { CreateAuthorizationCodeDto } from 'src/common/dto/oauth2/authorization-code.dto';
import { GetConnectInfoDto } from 'src/common/dto/oauth2/connected.dto';
import {
  ApplicationInfo,
  TokenResponse,
  AuthorizationResponse,
  ConnectInfoResponse,
  AccessTokenInfo,
  UserInfoResponse,
} from './oauth2.types';

@Controller('public/oauth')
export class Oauth2Controller {
  constructor(private readonly oauth2Service: Oauth2Service) {}

  @Get('/client/:id')
  @UseGuards(AuthGuard)
  async getApplication(
    @Param('id') clientId: string,
    @User('id') userId: number,
  ): Promise<ApplicationInfo> {
    return this.oauth2Service.getApplication(clientId, userId);
  }

  @Get('/connection')
  @UseGuards(AuthGuard)
  async getConnectionInfo(
    @Query('client') clientId: string,
    @Query('redirect_to') redirectTo: string,
    @User('id') userId: number,
  ): Promise<ConnectInfoResponse> {
    if (!clientId) {
      throw new BadRequestException('Client ID is required');
    }

    return this.oauth2Service.getConnectInfo({ clientId, redirectTo }, userId);
  }

  @Post('authorization')
  @UseGuards(AuthGuard)
  async authorize(
    @Body() authorizeData: CreateAuthorizationCodeDto,
    @User('id') userId: number,
  ): Promise<AuthorizationResponse> {
    return this.oauth2Service.authorization(authorizeData, userId);
  }

  @Post('token')
  async getToken(@Body() tokenData: Oauth2GetTokenDto): Promise<TokenResponse> {
    return this.oauth2Service.getToken(tokenData);
  }

  @Get('access_token_info')
  async getAccessTokenInfo(
    @Headers('Authorization') auth: string,
  ): Promise<AccessTokenInfo> {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    const [type, token] = auth.split(' ');
    if (!type || !token) {
      throw new BadRequestException('Invalid authorization header format');
    }

    return this.oauth2Service.getAccessTokenInfo(type, token);
  }

  @Get('user/me')
  async getUserInfo(
    @Headers('Authorization') auth: string,
  ): Promise<UserInfoResponse> {
    if (!auth) {
      throw new BadRequestException('Authorization header is required');
    }

    const [type, token] = auth.split(' ');
    if (!type || !token) {
      throw new BadRequestException('Invalid authorization header format');
    }

    return this.oauth2Service.getUserInfo(type, token);
  }
}
