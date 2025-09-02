import {
  Body,
  ConflictException,
  Controller,
  Get,
  Logger,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import { AuthService } from './auth.service';
import RegisterDto from 'src/common/dto/auth/register.dto';
import LoginDto from 'src/common/dto/auth/login.dto';
import { Request, Response } from 'express';
import { AuthGuard } from 'src/common/guards/auth.guard';
import ResetPasswordDto from 'src/common/dto/auth/reset-password.dto';
import { User } from 'src/common/decorator/get-user';

@Controller('auth')
export class AuthController {
  private readonly logger = new Logger(AuthController.name);
  constructor(private readonly authService: AuthService) {}

  @Post('/register')
  async register(@Body() registerDto: RegisterDto) {
    return await this.authService.registerUser(registerDto);
  }

  @Post('/login')
  async login(@Body() loginDto: LoginDto, @Res() res: Response) {
    const user = (await this.authService.validateUser(loginDto)).data;
    if (!user) {
      throw new ConflictException('user not found.');
    }
    const access_token = (await this.authService.generateAccessToken(user))
      .data;
    const refresh_token = (
      await this.authService.generateRefreshToken(user, loginDto)
    ).data;

    res.setHeader('Authorization', 'Bearer ' + [access_token, refresh_token]);
    res.cookie('sid', access_token, {
      httpOnly: true,
    });
    res.cookie('rid', refresh_token, {
      httpOnly: true,
    });
    res.send({
      status: 'success',
      message: `Successfully logined to user : ${user.email}`,
      data: {
        access_token,
        refresh_token,
      },
      timestamp: new Date(),
    });
  }

  @Post('/refresh')
  async refresh(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
  ) {
    const refreshToken = req.cookies['rid'];
    if (!refreshToken) {
      this.logger.warn('Refresh token not found in cookies');
      res.status(400).send({
        message: 'Refresh token not found in cookies',
      });
      return;
    }

    this.logger.debug(refreshToken);
    const token =
      (
        await this.authService.refresh({
          refreshToken: refreshToken,
        })
      ).data?.accessToken || '';

    res.setHeader('Authorization', 'Bearer' + token);
    res.cookie('sid', token, {
      httpOnly: true,
    });

    res.send({
      message: 'refreshed successfully',
      access_token: token,
    });
  }

  @Post('/reset-password')
  async resetPassWord(@Body() resetPasswordDto: ResetPasswordDto) {
    return await this.authService.resetPassword(resetPasswordDto);
  }

  @Post('/logout')
  @UseGuards(AuthGuard)
  async logout(@Req() req: Request, @Res() res: Response) {
    const refreshToken = req.cookies['rid'];
    try {
      if (refreshToken) {
        await this.authService.revokeRefreshTokenByValue(refreshToken);
      }
    } catch (e) {
      this.logger.warn('Failed to revoke refresh token on logout');
    }
    res.clearCookie('sid');
    res.clearCookie('rid');
    res.send({
      status: 'success',
      message: 'Logged out successfully',
      timestamp: new Date(),
    });
  }

  @Get('/authenticate')
  @UseGuards(AuthGuard)
  async isAuthenticated(@User('id') userId: number): Promise<any> {
    this.logger.log('Checking if a user is authenticated');
    return this.authService.getUserInfo(userId);
  }
}
