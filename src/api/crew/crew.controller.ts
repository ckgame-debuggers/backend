import { Controller, Get, Logger, Post, Req, UseGuards } from '@nestjs/common';
import { Request } from 'express';
import { CrewService } from './crew.service';
import { AuthGuard } from 'src/common/guards/auth.guard';
import { JwtPayload } from 'src/common/dto/auth/jwt-payload.dto';

@Controller('crew')
export class CrewController {
  private readonly logger = new Logger(CrewController.name);
  constructor(private readonly crewService: CrewService) {}

  @Post('/authenticate')
  @UseGuards(AuthGuard)
  isAuthenticated(@Req() req: Request): any {
    const user: JwtPayload = req['user'] as JwtPayload;
  }
}
